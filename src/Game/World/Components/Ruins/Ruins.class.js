import * as THREE from 'three';
import Game from '../../../Game.class';

export default class Ruins {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.resources = this.game.resources;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.params = {
      scale: 0.7,
      positionX: 0,
      positionY: 0,
      positionZ: -9,
      rotationY: 1.57,
    };

    this.setup();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setup() {
    const gltf = this.resources.items.ruinsModel;
    this.model = gltf.scene;

    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Clone material so we can modify color independently
        child.material = child.material.clone();
      }
    });

    this.model.scale.setScalar(this.params.scale);
    this.model.position.set(
      this.params.positionX,
      this.params.positionY,
      this.params.positionZ,
    );
    this.model.rotation.set(0, this.params.rotationY, 0);

    this.scene.add(this.model);
  }

  initTweakPane() {
    const folder = 'Ruins';

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
      'positionX',
      {
        label: 'Position X',
        min: -20,
        max: 20,
        step: 0.1,
        onChange: (v) => {
          this.model.position.x = v;
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
      'positionZ',
      {
        label: 'Position Z',
        min: -20,
        max: 20,
        step: 0.1,
        onChange: (v) => {
          this.model.position.z = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'rotationY',
      {
        label: 'Rotation Y',
        min: 0,
        max: 6.28,
        step: 0.01,
        onChange: (v) => {
          this.model.rotation.y = v;
        },
      },
      folder,
    );
  }

  destroy() {
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
        child.material?.dispose();
      }
    });
    this.scene.remove(this.model);
  }
}
