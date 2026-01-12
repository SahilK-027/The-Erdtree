import * as THREE from 'three';
import Game from '../Game.class';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class Camera {
  constructor(fov = 35, near = 0.1, far = 150) {
    this.game = Game.getInstance();
    this.canvas = this.game.canvas;
    this.sizes = this.game.sizes;
    this.scene = this.game.scene;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.params = { fov, near, far };

    // Erdtree focal point - look at the trunk/lower canopy
    this.targetPoint = new THREE.Vector3(0, 0.7, 0);

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

    // Cinematic low-angle hero shot - close and looking up
    this.cameraInstance.position.set(1.5, 0.85, 1.9);
    this.scene.add(this.cameraInstance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.cameraInstance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Focus on the erdtree
    this.controls.target.copy(this.targetPoint);

    // Cinematic constraints - allow looking up at the tree
    this.controls.minPolarAngle = Math.PI / 8; // Can look up high
    this.controls.maxPolarAngle = Math.PI / 2.05; // Prevent going below ground

    // Distance constraints - keep it intimate
    this.controls.minDistance = 1;
    this.controls.maxDistance = 5;

    // Smooth rotation
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;

    // Optional: auto-rotate for cinematic feel
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.3;
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
        min: -20,
        max: 20,
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
        max: 15,
        step: 0.1,
      },
      folder
    );

    this.debug.add(
      this.cameraInstance.position,
      'z',
      {
        label: 'Position Z',
        min: -20,
        max: 20,
        step: 0.1,
      },
      folder
    );

    this.debug.add(
      this.controls.target,
      'y',
      {
        label: 'Look At Y',
        min: 0,
        max: 5,
        step: 0.1,
      },
      folder
    );

    this.debug.add(
      this.controls,
      'autoRotate',
      {
        label: 'Auto Rotate',
      },
      folder
    );

    this.debug.add(
      this.controls,
      'autoRotateSpeed',
      {
        label: 'Rotate Speed',
        min: 0.1,
        max: 2,
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
