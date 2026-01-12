import * as THREE from 'three';
import Game from '../../../Game.class';
import { LAYERS } from '../../../PostProcessing/LayerConfig.util';

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
      shellScale: 1.002, // Outer shell scale multiplier
    };

    this.setup();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setup() {
    const gltf = this.resources.items.erdtreeModel;
    
    // Layer A (Core): The opaque inner mesh with "hard" gold color
    this.coreModel = gltf.scene;
    this.coreModel.traverse((child) => {
      if (child.isMesh) {
        child.layers.set(LAYERS.BLOOM);
      }
    });
    this.coreModel.scale.setScalar(this.params.scale);
    this.coreModel.position.y = this.params.positionY;
    this.scene.add(this.coreModel);

    // Layer B (Shell): Slightly scaled-up duplicate for holographic effect
    this.shellModel = gltf.scene.clone(true);
    this.shellModel.traverse((child) => {
      if (child.isMesh) {
        child.layers.set(LAYERS.BLOOM);
        // Clone materials so we can modify them independently
        if (child.material) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.5;
          child.material.side = THREE.DoubleSide;
          child.material.blending = THREE.AdditiveBlending;
          child.material.depthWrite = false;
        }
      }
    });
    const shellScaleValue = this.params.scale * this.params.shellScale;
    this.shellModel.scale.setScalar(shellScaleValue);
    this.shellModel.position.y = this.params.positionY;
    this.scene.add(this.shellModel);

    // Keep reference for backwards compatibility
    this.model = this.coreModel;
  }

  initTweakPane() {
    const folder = 'Erdtree';

    this.debug.add(this.params, 'scale', {
      label: 'Scale',
      min: 0.1,
      max: 5,
      step: 0.1,
      onChange: (v) => {
        this.coreModel.scale.setScalar(v);
        this.shellModel.scale.setScalar(v * this.params.shellScale);
      },
    }, folder);

    this.debug.add(this.params, 'positionY', {
      label: 'Position Y',
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => {
        this.coreModel.position.y = v;
        this.shellModel.position.y = v;
      },
    }, folder);

    this.debug.add(this.params, 'shellScale', {
      label: 'Shell Scale',
      min: 1.0,
      max: 1.05,
      step: 0.001,
      onChange: (v) => {
        this.shellModel.scale.setScalar(this.params.scale * v);
      },
    }, folder);
  }

  destroy() {
    // Dispose core model
    this.coreModel.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => mat.dispose());
        }
      }
    });
    this.scene.remove(this.coreModel);

    // Dispose shell model
    this.shellModel.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => mat.dispose());
        }
      }
    });
    this.scene.remove(this.shellModel);
  }
}
