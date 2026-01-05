import * as THREE from 'three';
import Game from '../Game.class';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Camera {
  constructor(fov = 65, near = 0.1, far = 100) {
    this.game = Game.getInstance();
    this.canvas = this.game.canvas;
    this.sizes = this.game.sizes;
    this.scene = this.game.scene;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.params = { fov, near, far };

    this.setPerspectiveCameraInstance(fov, near, far);
    this.setOrbitControls();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setPerspectiveCameraInstance(fov, near, far) {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance = new THREE.PerspectiveCamera(
      fov,
      aspectRatio,
      near,
      far
    );
    this.cameraInstance.position.set(0, 0.25, 2.5);
    this.scene.add(this.cameraInstance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.cameraInstance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2.3;
  }

  resize() {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance.aspect = aspectRatio;
    this.cameraInstance.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }

  initTweakPane() {
    const folder = 'Camera';

    this.debug.add(
      this.params,
      'fov',
      {
        label: 'FOV',
        min: 10,
        max: 120,
        step: 1,
        onChange: (v) => {
          this.cameraInstance.fov = v;
          this.cameraInstance.updateProjectionMatrix();
        },
      },
      folder
    );

    this.debug.add(
      this.cameraInstance.position,
      'x',
      {
        label: 'Position X',
        min: -10,
        max: 10,
        step: 0.1,
      },
      folder
    );

    this.debug.add(
      this.cameraInstance.position,
      'y',
      {
        label: 'Position Y',
        min: -10,
        max: 10,
        step: 0.1,
      },
      folder
    );

    this.debug.add(
      this.cameraInstance.position,
      'z',
      {
        label: 'Position Z',
        min: -10,
        max: 10,
        step: 0.1,
      },
      folder
    );

    this.debug.add(
      this.controls,
      'enableDamping',
      {
        label: 'Damping',
      },
      folder
    );

    this.debug.add(
      this.controls,
      'dampingFactor',
      {
        label: 'Damping Factor',
        min: 0.01,
        max: 0.3,
        step: 0.01,
      },
      folder
    );
  }
}
