import * as THREE from 'three';
import Game from '../../Game.class';
import vertexShader from '../../../Shaders/Composite/vertex.glsl';
import fragmentPostShader from '../../../Shaders/Composite/fragmentPost.glsl';
import fragmentCombinedShader from '../../../Shaders/Composite/fragmentCombined.glsl';

export default class CompositePass {
  constructor(bloomPass, glowPass) {
    this.game = Game.getInstance();
    this.sizes = this.game.sizes;
    this.renderer = this.game.renderer.rendererInstance;
    this.time = this.game.time;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;
    this.bloomPass = bloomPass;
    this.glowPass = glowPass;

    this.colorParams = {
      color: '#ffe5b8',
    };

    this.params = {
      bloomEnabled: true,
      glowEnabled: true,
    };

    this.createOrthographicCamera();
    this.createBloomComposite();
    this.createGlowComposite();
    this.createCombinedComposite();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  createOrthographicCamera() {
    const frustumSize = 1;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * this.sizes.aspect) / 2,
      (frustumSize * this.sizes.aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -1000,
      1000
    );
    this.camera.position.set(0, 0, 1);
  }

  createBloomComposite() {
    const shader = {
      uniforms: {
        bloomTexture: { value: this.bloomPass.composer.renderTarget2.texture },
      },
      vertexShader: vertexShader,
      fragmentShader: `
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          vec4 bloom = texture2D(bloomTexture, vUv);
          gl_FragColor = bloom;
        }
      `,
    };

    this.bloomMaterial = new THREE.ShaderMaterial({
      uniforms: shader.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
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

  createGlowComposite() {
    const initialColor = new THREE.Color(this.colorParams.color);

    this.glowMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentPostShader,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uMap: { value: null },
        uTime: { value: 0 },
        uMeshCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uColorMultiplier: {
          value: new THREE.Color(
            initialColor.r,
            initialColor.g,
            initialColor.b
          ),
        },
      },
    });

    this.glowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.sizes.aspect, 1),
      this.glowMaterial
    );

    this.glowScene = new THREE.Scene();
    this.glowScene.add(this.glowMesh);
  }

  createCombinedComposite() {
    const initialColor = new THREE.Color(this.colorParams.color);

    this.combinedMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentCombinedShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        bloomTexture: { value: this.bloomPass.composer.renderTarget2.texture },
        glowTexture: { value: null },
        uTime: { value: 0 },
        uMeshCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uColorMultiplier: {
          value: new THREE.Color(
            initialColor.r,
            initialColor.g,
            initialColor.b
          ),
        },
        bloomEnabled: { value: this.params.bloomEnabled },
        glowEnabled: { value: this.params.glowEnabled },
      },
    });

    this.combinedMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.sizes.aspect, 1),
      this.combinedMaterial
    );

    this.combinedScene = new THREE.Scene();
    this.combinedScene.add(this.combinedMesh);
  }

  updateGlowUniforms(meshPosition, camera) {
    this.glowMaterial.uniforms.uTime.value = this.time.elapsed;

    const meshScreenPos = meshPosition.clone();
    meshScreenPos.project(camera);

    const meshUV = new THREE.Vector2(
      (meshScreenPos.x + 1) / 2,
      (meshScreenPos.y + 1) / 2
    );

    this.glowMaterial.uniforms.uMeshCenter.value.copy(meshUV);
  }

  renderBloom() {
    if (!this.params.bloomEnabled) return;
    this.bloomMaterial.uniforms.bloomTexture.value =
      this.bloomPass.composer.renderTarget2.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.bloomScene, this.camera);
  }

  renderGlow() {
    if (!this.params.glowEnabled) return;
    this.glowMaterial.uniforms.uMap.value = this.glowPass.renderTarget.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.glowScene, this.camera);
  }

  renderCombined() {
    this.combinedMaterial.uniforms.bloomTexture.value = this.bloomPass.composer.renderTarget2.texture;
    this.combinedMaterial.uniforms.glowTexture.value = this.glowPass.renderTarget.texture;
    this.combinedMaterial.uniforms.uTime.value = this.time.elapsed;
    this.combinedMaterial.uniforms.bloomEnabled.value = this.params.bloomEnabled;
    this.combinedMaterial.uniforms.glowEnabled.value = this.params.glowEnabled;
    
    if (this.params.glowEnabled) {
      const meshPosition = this.game.world?.godrays?.sourceMesh?.position;
      if (meshPosition) {
        const meshScreenPos = meshPosition.clone();
        meshScreenPos.project(this.game.camera.cameraInstance);
        const meshUV = new THREE.Vector2(
          (meshScreenPos.x + 1) / 2,
          (meshScreenPos.y + 1) / 2
        );
        this.combinedMaterial.uniforms.uMeshCenter.value.copy(meshUV);
      }
    }
    
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.combinedScene, this.camera);
  }

  initTweakPane() {
    const folder = 'Composite';

    this.debug.add(this.params, 'bloomEnabled', {
      label: 'Bloom Enabled',
      onChange: (v) => {
        this.combinedMaterial.uniforms.bloomEnabled.value = v;
      },
    }, folder);

    this.debug.add(this.params, 'glowEnabled', {
      label: 'Glow Enabled',
      onChange: (v) => {
        this.combinedMaterial.uniforms.glowEnabled.value = v;
      },
    }, folder);

    this.debug.add(this.colorParams, 'color', {
      label: 'Glow Color',
      color: true,
      onChange: (v) => {
        const color = new THREE.Color(v);
        this.glowMaterial.uniforms.uColorMultiplier.value.copy(color);
        this.combinedMaterial.uniforms.uColorMultiplier.value.copy(color);
      },
    }, folder);
  }

  resize() {
    const frustumSize = 1;
    this.camera.left = (-frustumSize * this.sizes.aspect) / 2;
    this.camera.right = (frustumSize * this.sizes.aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    const newAspect = this.sizes.aspect;
    
    if (!this.lastAspect || Math.abs(this.lastAspect - newAspect) > 0.01) {
      this.bloomMesh.geometry.dispose();
      this.bloomMesh.geometry = new THREE.PlaneGeometry(newAspect, 1);

      this.glowMesh.geometry.dispose();
      this.glowMesh.geometry = new THREE.PlaneGeometry(newAspect, 1);
      
      this.combinedMesh.geometry.dispose();
      this.combinedMesh.geometry = new THREE.PlaneGeometry(newAspect, 1);
      
      this.lastAspect = newAspect;
    }
  }

  destroy() {
    this.bloomMesh.geometry.dispose();
    this.bloomMaterial.dispose();
    this.glowMesh.geometry.dispose();
    this.glowMaterial.dispose();
    this.combinedMesh.geometry.dispose();
    this.combinedMaterial.dispose();
  }
}
