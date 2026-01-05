import * as THREE from 'three';
import Game from '../../../Game.class';
import { LAYERS } from '../../../PostProcessing/LayerConfig.util';
import vertexShader from '../../../../Shaders/Godrays/vertex.glsl';
import fragmentShader from '../../../../Shaders/Godrays/fragment.glsl';

export default class Godrays {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.resources = this.game.resources;
    this.time = this.game.time;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.colorParams = {
      color: '#ffe5b8',
    };

    this.params = {
      rotationSpeed: 0.25,
      tile: 7,
      cutoff: 0.35,
      feather: 0.02,
    };

    this.setup();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setup() {
    const initialColor = new THREE.Color(this.colorParams.color);

    this.map = this.resources.items.godraysPatternMap;
    this.map.wrapS = THREE.RepeatWrapping;
    this.map.wrapT = THREE.RepeatWrapping;

    // Source sphere (layer GLOW)
    this.sourceGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    this.sourceMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: this.map },
        uTile: { value: this.params.tile },
        uCutoff: { value: this.params.cutoff },
        uFeather: { value: this.params.feather },
      },
    });

    this.sourceMesh = new THREE.Mesh(this.sourceGeometry, this.sourceMaterial);
    this.sourceMesh.position.y = 1.12;
    this.sourceMesh.layers.set(LAYERS.GLOW);
    this.scene.add(this.sourceMesh);

    // Inner bloom sphere (layer BLOOM)
    this.bloomGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    this.bloomMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(initialColor.r, initialColor.g, initialColor.b),
    });

    this.bloomMesh = new THREE.Mesh(this.bloomGeometry, this.bloomMaterial);
    this.bloomMesh.layers.set(LAYERS.BLOOM);
    this.bloomMesh.position.y = 1.12;
    this.scene.add(this.bloomMesh);
  }

  update() {
    this.sourceMesh.rotation.y = -this.time.elapsed * this.params.rotationSpeed;

    if (this.game.renderPipeline?.postProcessing?.compositePass) {
      this.game.renderPipeline.postProcessing.compositePass.updateGlowUniforms(
        this.sourceMesh.position,
        this.game.camera.cameraInstance
      );
    }
  }

  initTweakPane() {
    const folder = 'Godrays';

    this.debug.add(this.params, 'rotationSpeed', {
      label: 'Rotation Speed',
      min: 0,
      max: 2,
      step: 0.01,
    }, folder);

    this.debug.add(this.params, 'tile', {
      label: 'Tile',
      min: 1,
      max: 20,
      step: 1,
      onChange: (v) => { this.sourceMaterial.uniforms.uTile.value = v; },
    }, folder);

    this.debug.add(this.params, 'cutoff', {
      label: 'Cutoff',
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => { this.sourceMaterial.uniforms.uCutoff.value = v; },
    }, folder);

    this.debug.add(this.params, 'feather', {
      label: 'Feather',
      min: 0,
      max: 0.2,
      step: 0.001,
      onChange: (v) => { this.sourceMaterial.uniforms.uFeather.value = v; },
    }, folder);

    this.debug.add(this.sourceMesh.position, 'y', {
      label: 'Height',
      min: 0,
      max: 3,
      step: 0.01,
      onChange: (v) => { this.bloomMesh.position.y = v; },
    }, folder);

    this.debug.add(this.colorParams, 'color', {
      label: 'Color',
      color: true,
      onChange: (v) => {
        const color = new THREE.Color(v);
        this.bloomMaterial.color.copy(color);
        if (this.game.renderPipeline?.postProcessing?.compositePass) {
          this.game.renderPipeline.postProcessing.compositePass.glowMaterial.uniforms.uColorMultiplier.value.copy(color);
        }
      },
    }, folder);
  }

  destroy() {
    this.sourceGeometry.dispose();
    this.sourceMaterial.dispose();
    this.bloomGeometry.dispose();
    this.bloomMaterial.dispose();
    this.scene.remove(this.sourceMesh, this.bloomMesh);
  }
}
