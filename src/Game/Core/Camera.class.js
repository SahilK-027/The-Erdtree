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

    // Cursor for parallax
    this.cursor = { x: 0, y: 0 };
    
    // Parallax settings
    this.parallaxStrength = 0.025;
    this.parallaxEasing = 3.0;

    this.setCameraGroup();
    this.setPerspectiveCameraInstance(fov, near, far);
    this.setOrbitControls();
    this.setupCursorTracking();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setCameraGroup() {
    // Create camera group for parallax effect
    this.cameraGroup = new THREE.Group();
    this.scene.add(this.cameraGroup);
  }

  setPerspectiveCameraInstance(fov, near, far) {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance = new THREE.PerspectiveCamera(
      fov,
      aspectRatio,
      near,
      far,
    );

    // Cinematic low-angle hero shot - close and looking up
    this.cameraInstance.position.set(
      1.4274844135230773,
      0.1,
      1.2825497963632837,
    );
    this.cameraGroup.add(this.cameraInstance);
  }

  setupCursorTracking() {
    window.addEventListener('mousemove', (event) => {
      // Normalize cursor position from -0.5 to 0.5
      this.cursor.x = event.clientX / this.sizes.width - 0.5;
      this.cursor.y = event.clientY / this.sizes.height - 0.5;
    });
  }

  setOrbitControls() {
    this.controls = new OrbitControls(this.cameraInstance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.enableRotate = false;
    this.controls.enableZoom = false;
    this.controls.target.copy(this.targetPoint);
    this.controls.minPolarAngle = Math.PI / 8;
    this.controls.maxPolarAngle = Math.PI / 2.05;
  }

  resize() {
    const aspectRatio = this.sizes.width / this.sizes.height;
    this.cameraInstance.aspect = aspectRatio;
    this.cameraInstance.updateProjectionMatrix();
  }

  update() {
    this.controls.update();

    // Apply parallax effect with delta time for consistent animation across frame rates
    const parallaxX = this.cursor.x * this.parallaxStrength;
    const parallaxY = -this.cursor.y * this.parallaxStrength; // Inverted for natural feel

    // Smooth parallax with delta-time-based easing
    // delta is already in seconds from Time.class.js
    this.cameraGroup.position.x += (parallaxX - this.cameraGroup.position.x) * this.parallaxEasing * this.game.time.delta;
    this.cameraGroup.position.y += (parallaxY - this.cameraGroup.position.y) * this.parallaxEasing * this.game.time.delta;
  }

  initTweakPane() {
    const folder = 'Camera';

    this.debug.add(
      this,
      'parallaxStrength',
      {
        label: 'Parallax Strength',
        min: 0,
        max: 2,
        step: 0.01,
      },
      folder,
    );

    this.debug.add(
      this,
      'parallaxEasing',
      {
        label: 'Parallax Easing',
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      folder,
    );

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
