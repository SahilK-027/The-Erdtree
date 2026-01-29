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
    this.time = this.game.time;

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

    // Intro camera animation
    this.introStartPosition = new THREE.Vector3(2.5, 1.5, 0.3); // Near top of tree, close to leaves
    this.introStartTarget = new THREE.Vector3(2.5, 1.5, 0); // Looking at upper canopy
    this.introAnimation = {
      isActive: false,
      progress: 0,
      duration: 6,
      startTime: 0,
      easeOutCubic: (t) => 1 - Math.pow(1 - t, 3), // Smooth easing
    };

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

    // Start at intro position, will lerp to initial position when animation starts
    this.cameraInstance.position.copy(this.introStartPosition);
    this.scene.add(this.cameraInstance);
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.cameraInstance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enableRotate = false;
    this.controls.enableZoom = false;
    this.controls.enabled = false;
    this.controls.target.copy(this.introStartTarget);
    this.controls.minPolarAngle = Math.PI / 8;
    this.controls.maxPolarAngle = Math.PI / 2.05;

    // Calculate ratio overflow for later use
    const currentRatio = this.sizes.width / this.sizes.height;
    this.ratioOverflow = Math.max(1, this.idealRatio / currentRatio) - 1;
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
      const targetAdjustment = this.ratioOverflow * 0.35;
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

  startIntroAnimation() {
    this.introAnimation.isActive = true;
    this.introAnimation.progress = 0;
    this.introAnimation.startTime = this.time.elapsed;

    // Set camera to start position
    this.cameraInstance.position.copy(this.introStartPosition);
    this.controls.target.copy(this.introStartTarget);
    this.controls.enabled = false;
  }

  update() {
    // Handle intro animation
    if (this.introAnimation.isActive) {
      const elapsed = this.time.elapsed - this.introAnimation.startTime;
      const rawProgress = Math.min(elapsed / this.introAnimation.duration, 1);
      this.introAnimation.progress =
        this.introAnimation.easeOutCubic(rawProgress);

      // Calculate adjusted end position based on aspect ratio
      const baseDistance = this.initialCameraPosition.length();
      const additionalDistance = baseDistance * this.ratioOverflow * 0.27;
      const direction = this.initialCameraPosition.clone().normalize();
      const newDistance = baseDistance + additionalDistance;
      const adjustedEndPosition = direction.multiplyScalar(newDistance);

      // Calculate adjusted end target
      const targetAdjustment = this.ratioOverflow * 0.27;
      const adjustedEndTarget = this.targetPoint.clone();
      adjustedEndTarget.z -= targetAdjustment;

      // Lerp camera position
      this.cameraInstance.position.lerpVectors(
        this.introStartPosition,
        adjustedEndPosition,
        this.introAnimation.progress,
      );

      // Lerp camera target
      this.controls.target.lerpVectors(
        this.introStartTarget,
        adjustedEndTarget,
        this.introAnimation.progress,
      );

      // End animation
      if (rawProgress >= 1) {
        this.introAnimation.isActive = false;
        this.controls.enabled = true;
      }
    }

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
