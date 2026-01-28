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
      color: '#f2db8e',
    };

    this.params = {
      bloomEnabled: true,
      glowEnabled: true,
      glowSamples: 24,
    };

    // Reusable vector to avoid allocations
    this.tempMeshScreenPos = new THREE.Vector3();
    this.tempMeshUV = new THREE.Vector2();

    this.createOrthographicCamera();
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
      1000,
    );
    this.camera.position.set(0, 0, 1);
  }

  createCombinedComposite() {
    const initialColor = new THREE.Color(this.colorParams.color);

    this.combinedMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentCombinedShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        bloomTexture: { value: null },
        glowTexture: { value: null },
        uTime: { value: 0 },
        uMeshCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uColorMultiplier: {
          value: new THREE.Color(
            initialColor.r,
            initialColor.g,
            initialColor.b,
          ),
        },
        bloomEnabled: { value: this.params.bloomEnabled },
        glowEnabled: { value: this.params.glowEnabled },
        glowSamples: { value: this.params.glowSamples },
      },
    });

    this.combinedMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.sizes.aspect, 1),
      this.combinedMaterial,
    );

    this.combinedScene = new THREE.Scene();
    this.combinedScene.add(this.combinedMesh);
  }

  renderCombined() {
    const uniforms = this.combinedMaterial.uniforms;

    uniforms.bloomTexture.value = this.bloomPass.renderTarget.texture;
    uniforms.glowTexture.value = this.glowPass.renderTarget.texture;
    uniforms.uTime.value = this.time.elapsed;

    if (this.params.glowEnabled) {
      const meshPosition = this.game.world?.godrays?.sourceMesh?.position;
      if (meshPosition) {
        // Reuse temp vectors to avoid allocations
        this.tempMeshScreenPos.copy(meshPosition);
        this.tempMeshScreenPos.project(this.game.camera.cameraInstance);

        this.tempMeshUV.set(
          (this.tempMeshScreenPos.x + 1) * 0.5,
          (this.tempMeshScreenPos.y + 1) * 0.5,
        );
        uniforms.uMeshCenter.value.copy(this.tempMeshUV);
      }
    }

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.combinedScene, this.camera);
  }

  initTweakPane() {
    const folder = 'Composite';

    this.debug.add(
      this.params,
      'bloomEnabled',
      {
        label: 'Bloom Enabled',
        onChange: (v) => {
          this.combinedMaterial.uniforms.bloomEnabled.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'glowEnabled',
      {
        label: 'Glow Enabled',
        onChange: (v) => {
          this.combinedMaterial.uniforms.glowEnabled.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'glowSamples',
      {
        label: 'Glow Samples',
        min: 4,
        max: 64,
        step: 4,
        onChange: (v) => {
          this.combinedMaterial.uniforms.glowSamples.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.colorParams,
      'color',
      {
        label: 'Glow Color',
        color: true,
        onChange: (v) => {
          const color = new THREE.Color(v);
          this.combinedMaterial.uniforms.uColorMultiplier.value.copy(color);
        },
      },
      folder,
    );
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
      this.combinedMesh.geometry.dispose();
      this.combinedMesh.geometry = new THREE.PlaneGeometry(newAspect, 1);

      this.lastAspect = newAspect;
    }
  }

  destroy() {
    this.combinedMesh.geometry.dispose();
    this.combinedMaterial.dispose();
  }
}
