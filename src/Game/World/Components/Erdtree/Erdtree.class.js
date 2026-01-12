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
    };

    this.setup();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setup() {
    const gltf = this.resources.items.erdtreeModel;
    this.model = gltf.scene;

    // Set to NO_FX layer (default layer 0)
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.layers.set(LAYERS.BLOOM);
      }
    });

    this.model.scale.setScalar(this.params.scale);
    this.model.position.y = this.params.positionY;

    this.scene.add(this.model);
  }

  initTweakPane() {
    const folder = 'Erdtree';

    this.debug.add(this.params, 'scale', {
      label: 'Scale',
      min: 0.1,
      max: 5,
      step: 0.1,
      onChange: (v) => { this.model.scale.setScalar(v); },
    }, folder);

    this.debug.add(this.params, 'positionY', {
      label: 'Position Y',
      min: -5,
      max: 5,
      step: 0.1,
      onChange: (v) => { this.model.position.y = v; },
    }, folder);
  }

  destroy() {
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => mat.dispose());
        }
      }
    });
    this.scene.remove(this.model);
  }
}
