import * as THREE from 'three';
import Game from '../../../Game.class';
import { LAYERS } from '../../../PostProcessing/LayerConfig.util';
import vertexShaderErdTree from '../../../../Shaders/Erdtree/vertex.glsl';
import fragmentShaderErdTree from '../../../../Shaders/Erdtree/fragment.glsl';

export default class Erdtree {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.resources = this.game.resources;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.params = {
      scale: 1,
      positionY: -0.1,
      baseColor: '#8c8671',
      fresnelColor: '#e8d2b1',
      fresnelPower: 2.0,
      fresnelIntensity: 1.0,
      trunkFadeStart: -1.0,
      trunkFadeEnd: 0.5,
      trunkOpacity: 0.2,
      glowIntensity: 0.8,
    };

    this.setup();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setup() {
    const gltf = this.resources.items.erdtreeModel;
    this.model = gltf.scene;

    this.createShaderMaterial();

    this.model.traverse((child) => {
      if (child.isMesh) {
        child.layers.set(LAYERS.BLOOM);
        child.material = this.shaderMaterial;
      }
    });

    this.model.scale.setScalar(this.params.scale);
    this.model.position.y = this.params.positionY;
    this.scene.add(this.model);
  }

  createShaderMaterial() {
    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBaseColor: { value: new THREE.Color(this.params.baseColor) },
        uFresnelColor: { value: new THREE.Color(this.params.fresnelColor) },
        uFresnelPower: { value: this.params.fresnelPower },
        uFresnelIntensity: { value: this.params.fresnelIntensity },
        uTrunkFadeStart: { value: this.params.trunkFadeStart },
        uTrunkFadeEnd: { value: this.params.trunkFadeEnd },
        uTrunkOpacity: { value: this.params.trunkOpacity },
        uGlowIntensity: { value: this.params.glowIntensity },
      },
      vertexShader: vertexShaderErdTree,
      fragmentShader: fragmentShaderErdTree,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  initTweakPane() {
    const folder = 'Erdtree';

    this.debug.add(
      this.params,
      'scale',
      {
        label: 'Scale',
        min: 0.1,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          this.model.scale.setScalar(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'positionY',
      {
        label: 'Position Y',
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          this.model.position.y = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'baseColor',
      {
        label: 'Base Color',
        onChange: (v) => {
          this.shaderMaterial.uniforms.uBaseColor.value.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'fresnelColor',
      {
        label: 'Fresnel Color',
        onChange: (v) => {
          this.shaderMaterial.uniforms.uFresnelColor.value.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'fresnelPower',
      {
        label: 'Fresnel Power',
        min: 0.1,
        max: 10,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uFresnelPower.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'fresnelIntensity',
      {
        label: 'Fresnel Intensity',
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uFresnelIntensity.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'trunkFadeStart',
      {
        label: 'Trunk Fade Start',
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uTrunkFadeStart.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'trunkFadeEnd',
      {
        label: 'Trunk Fade End',
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uTrunkFadeEnd.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'trunkOpacity',
      {
        label: 'Trunk Opacity',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uTrunkOpacity.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'glowIntensity',
      {
        label: 'Glow Intensity',
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uGlowIntensity.value = v;
        },
      },
      folder,
    );
  }

  destroy() {
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
      }
    });
    this.shaderMaterial?.dispose();
    this.scene.remove(this.model);
  }
}
