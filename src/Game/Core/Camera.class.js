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
    this.targetPoint = new THREE.Vector3(2.8, 0.85, 0);

    this.idealRatio = 16 / 9;
    this.ratioOverflow = 0;
    this.initialCameraPosition = new THREE.Vector3(
      1.4274844135230773,
      0.1,
      1.2825497963632837,
    );

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
      far,
    );

    this.cameraInstance.position.copy(this.initialCameraPosition);
    this.scene.add(this.cameraInstance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.cameraInstance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enableRotate = false;
    this.controls.enableZoom = false;
    this.controls.target.copy(this.targetPoint);
    this.controls.minPolarAngle = Math.PI / 8;
    this.controls.maxPolarAngle = Math.PI / 2.05;

    this.updateCameraForAspectRatio();
  }

  updateCameraForAspectRatio() {
    const currentRatio = this.sizes.width / this.sizes.height;
    this.ratioOverflow = Math.max(1, this.idealRatio / currentRatio) - 1;

    const baseDistance = this.initialCameraPosition.length();
    const additionalDistance = baseDistance * this.ratioOverflow * 0.27;
    const direction = this.initialCameraPosition.clone().normalize();
    const newDistance = baseDistance + additionalDistance;
    const adjustedPosition = direction.multiplyScalar(newDistance);

    this.cameraInstance.position.copy(adjustedPosition);

    // Update target point based on ratio overflow (only if controls exist)
    if (this.controls) {
      const targetAdjustment = this.ratioOverflow * 0.27;
      const adjustedTarget = this.targetPoint.clone();
      adjustedTarget.z -= targetAdjustment;
      this.controls.target.copy(adjustedTarget);
    }
  }

  resize() {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance.aspect = aspectRatio;
    this.cameraInstance.updateProjectionMatrix();

    this.updateCameraForAspectRatio();
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
      folder,
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
      folder,
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
      folder,
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
      folder,
    );

    this.debug.add(
      this.controls.target,
      'x',
      {
        label: 'Target X',
        min: -10,
        max: 10,
        step: 0.1,
      },
      folder,
    );

    this.debug.add(
      this.controls.target,
      'y',
      {
        label: 'Target Y',
        min: -5,
        max: 10,
        step: 0.1,
      },
      folder,
    );

    this.debug.add(
      this.controls.target,
      'z',
      {
        label: 'Target Z',
        min: -10,
        max: 10,
        step: 0.1,
      },
      folder,
    );

    this.debug.add(
      this.controls,
      'autoRotate',
      {
        label: 'Auto Rotate',
      },
      folder,
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
      folder,
    );

    this.debug.add(
      this.controls,
      'enableDamping',
      {
        label: 'Damping',
      },
      folder,
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
      folder,
    );
  }
}
