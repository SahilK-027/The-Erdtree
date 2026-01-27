import * as THREE from 'three';
import Game from '../Game.class';
import PostProcessing from '../PostProcessing/PostProcessing.class';
import { PASS_CONFIG } from '../PostProcessing/LayerConfig.util';

export default class RenderPipeline {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.camera = this.game.camera.cameraInstance;
    this.renderer = this.game.renderer.rendererInstance;
    this.sizes = this.game.sizes;

    this.postProcessing = new PostProcessing();
    this.cachedLayerMasks = new Map();
    this.currentLayerMask = null;
    this.initializeLayerMasks();
    this.createBloomComposite();
  }

  createBloomComposite() {
    // Create orthographic camera for full-screen quad
    const frustumSize = 1;
    this.orthoCamera = new THREE.OrthographicCamera(
      (-frustumSize * this.sizes.aspect) / 2,
      (frustumSize * this.sizes.aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -1000,
      1000
    );
    this.orthoCamera.position.set(0, 0, 1);

    // Create material to render bloom texture
    this.bloomMaterial = new THREE.ShaderMaterial({
      uniforms: {
        bloomTexture: { value: null },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          vec4 bloom = texture2D(bloomTexture, vUv);
          gl_FragColor = bloom;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.bloomMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.sizes.aspect, 1),
      this.bloomMaterial
    );

    this.bloomScene = new THREE.Scene();
    this.bloomScene.add(this.bloomMesh);
  }

  initializeLayerMasks() {
    Object.keys(PASS_CONFIG).forEach((key) => {
      const layers = PASS_CONFIG[key];
      this.cachedLayerMasks.set(key, [...layers]);
    });
  }

  setCameraToLayers(layersArray) {
    const key = layersArray.slice().sort().join(',');
    
    if (this.currentLayerKey !== key) {
      if (layersArray.length === 1) {
        this.camera.layers.set(layersArray[0]);
      } else {
        this.camera.layers.disableAll();
        layersArray.forEach((layer) => {
          this.camera.layers.enable(layer);
        });
      }
      this.currentLayerKey = key;
    }
  }

  render() {
    // PASS 1: Render only glow objects to render target
    this.setCameraToLayers(PASS_CONFIG.GLOW_CAPTURE);
    this.renderer.setRenderTarget(this.postProcessing.glowPass.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // PASS 2: Render bloom layer to temporary target, then apply bloom effect
    this.setCameraToLayers(PASS_CONFIG.BLOOM_RENDER);
    this.renderer.setRenderTarget(this.postProcessing.bloomPass.renderTarget1);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    
    // Apply bloom post-processing
    this.postProcessing.bloomPass.render();

    // PASS 3: Render the entire scene normally to the screen
    this.setCameraToLayers(PASS_CONFIG.MAIN_SCENE);
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // PASS 4: Apply bloom on top with additive blending
    this.renderer.autoClear = false;
    this.bloomMaterial.uniforms.bloomTexture.value = this.postProcessing.bloomPass.renderTarget.texture;
    this.renderer.render(this.bloomScene, this.orthoCamera);
    this.renderer.autoClear = true;
  }

  resize() {
    this.postProcessing.resize();
    
    // Update orthographic camera
    const frustumSize = 1;
    this.orthoCamera.left = (-frustumSize * this.sizes.aspect) / 2;
    this.orthoCamera.right = (frustumSize * this.sizes.aspect) / 2;
    this.orthoCamera.top = frustumSize / 2;
    this.orthoCamera.bottom = -frustumSize / 2;
    this.orthoCamera.updateProjectionMatrix();

    // Update bloom mesh geometry
    const newAspect = this.sizes.aspect;
    if (!this.lastAspect || Math.abs(this.lastAspect - newAspect) > 0.01) {
      this.bloomMesh.geometry.dispose();
      this.bloomMesh.geometry = new THREE.PlaneGeometry(newAspect, 1);
      this.lastAspect = newAspect;
    }
  }

  destroy() {
    this.postProcessing.destroy();
    this.bloomMesh.geometry.dispose();
    this.bloomMaterial.dispose();
  }
}
