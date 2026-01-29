import * as THREE from 'three';
import Game from '../../../Game.class';
import * as MATH from '../../../Utils/Math.class';

export default class Smoke {
  constructor(options = {}) {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.camera = this.game.camera.cameraInstance;
    this.resources = this.game.resources;
    this.time = this.game.time;
    this.debug = this.game.debug;

    // Configuration
    this.config = {
      radius: options.radius || 10,
      segments: options.segments || 16,
      rings: options.rings || 8,
      planeSize: options.planeSize || 0.5,
      color: options.color || 0xffffff,
      opacity: options.opacity || 1,
      randomRange: options.randomRange || 20,
      yOffset: options.yOffset || 0,
      floatingSpeed: options.floatingSpeed || 0.001,
      rotationSpeed: options.rotationSpeed || 0.003,
      floatingAmplitude: options.floatingAmplitude || 1.5,
      ...options,
    };

    this.createDome();
    this.setupDebug();
  }

  createDome() {
    const {
      radius,
      segments,
      rings,
      planeSize,
      color,
      opacity,
      randomRange,
      yOffset,
    } = this.config;

    // Calculate total instances
    const instanceCount = segments * rings;

    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize);

    // Create texture-based material
    this.smokeMaterial = new THREE.MeshBasicMaterial({
      depthWrite: false,
      transparent: true,
      alphaMap: this.resources.items.smokeTexture,
      opacity: opacity,
      color: new THREE.Color(color),
    });
    
    // Test material
    // this.smokeMaterial = new THREE.MeshBasicMaterial({
    //   color: new THREE.Color('red'),
    // });

    // Create instanced mesh
    this.mesh = new THREE.InstancedMesh(
      geometry,
      this.smokeMaterial,
      instanceCount,
    );
    this.mesh.layers.set(0);

    // Store positions and animation data for update loop
    this.particles = [];

    // Position instances in front of camera view
    const dummy = new THREE.Object3D();
    let index = 0;

    // Camera is at approximately (1.43, 0.1, 1.28) looking at (2.8, 0.85, 0)
    // We want smoke concentrated in the forward view frustum
    const cameraPos = new THREE.Vector3(1.43, 0.1, 1.28);
    const targetPos = new THREE.Vector3(2.8, 0.85, 0);
    const viewDirection = new THREE.Vector3()
      .subVectors(targetPos, cameraPos)
      .normalize();

    for (let ring = 0; ring < rings; ring++) {
      // Distribute along depth from camera
      const depth = 2 + (ring / rings) * randomRange;

      for (let seg = 0; seg < segments; seg++) {
        // Create positions in a cone/frustum shape in front of camera
        // Use spherical distribution but biased forward
        const horizontalAngle = (seg / segments) * Math.PI * 2;
        const spreadRadius = (1 + ring / rings) * randomRange * 0.4;

        // Offset from view direction
        const offsetX =
          Math.cos(horizontalAngle) *
          spreadRadius *
          (0.3 + MATH.random() * 0.7);
        const offsetY =
          Math.sin(horizontalAngle) *
          spreadRadius *
          (0.3 + MATH.random() * 0.7);

        // Position along view direction with offsets
        const x = cameraPos.x + viewDirection.x * depth + offsetX;
        const z = cameraPos.z + viewDirection.z * depth + offsetX * 0.5;
        const y = cameraPos.y + depth * 0.3 + offsetY + yOffset;

        // Store position and animation data
        this.particles.push({
          baseX: x,
          baseY: y,
          baseZ: z,
          floatingSpeed: MATH.random() * this.config.floatingSpeed,
          rotationSpeed:
            (MATH.random() - 0.5) * MATH.random() * this.config.rotationSpeed,
          floatingAmplitude:
            0.5 + MATH.random() * this.config.floatingAmplitude,
        });

        dummy.position.set(x, y, z);

        // Make plane face the camera position
        dummy.lookAt(cameraPos);

        dummy.updateMatrix();
        this.mesh.setMatrixAt(index, dummy.matrix);

        index++;
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.mesh);
  }

  update() {
    // Update planes to face camera with animation
    const dummy = new THREE.Object3D();
    const cameraPosition = this.camera.position;
    const elapsedTime = this.time.elapsed * 150.0;
    const minHeight = 1.5;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      // Animate position with floating motion
      const x = particle.baseX;
      const y = Math.max(
        minHeight,
        particle.baseY +
          Math.sin(elapsedTime * particle.floatingSpeed) *
            particle.floatingAmplitude,
      );
      const z = particle.baseZ;

      dummy.position.set(x, y, z);
      dummy.lookAt(cameraPosition);

      // Add rotation animation (negative for anticlockwise)
      dummy.rotation.z = -elapsedTime * particle.rotationSpeed;

      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  setupDebug() {
    if (!this.debug) return;

    this.debug.add(
      this.config,
      'opacity',
      {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Opacity',
        onChange: (v) => {
          this.smokeMaterial.opacity = v;
        },
      },
      'Smoke',
    );

    this.debug.add(
      this.config,
      'planeSize',
      {
        min: 0.1,
        max: 2,
        step: 0.1,
        label: 'Plane Size',
        onChange: () => {
          this.recreateDome();
        },
      },
      'Smoke',
    );

    this.debug.add(
      this.smokeMaterial,
      'color',
      { color: true, label: 'Color' },
      'Smoke',
    );

    this.debug.add(
      this.config,
      'yOffset',
      {
        min: -10,
        max: 20,
        step: 0.5,
        label: 'Y Offset',
        onChange: () => {
          this.recreateDome();
        },
      },
      'Smoke',
    );

    this.debug.add(
      this.config,
      'randomRange',
      {
        min: 5,
        max: 50,
        step: 1,
        label: 'Random Range',
        onChange: () => {
          this.recreateDome();
        },
      },
      'Smoke',
    );

    this.debug.add(
      this.config,
      'floatingSpeed',
      {
        min: 0,
        max: 0.005,
        step: 0.0001,
        label: 'Floating Speed',
        onChange: (v) => {
          this.particles.forEach((p) => (p.floatingSpeed = MATH.random() * v));
        },
      },
      'Smoke',
    );

    this.debug.add(
      this.config,
      'rotationSpeed',
      {
        min: 0,
        max: 0.01,
        step: 0.0001,
        label: 'Rotation Speed',
        onChange: (v) => {
          this.particles.forEach(
            (p) =>
              (p.rotationSpeed = (MATH.random() - 0.5) * MATH.random() * v),
          );
        },
      },
      'Smoke',
    );

    this.debug.add(
      this.config,
      'floatingAmplitude',
      {
        min: 0,
        max: 5,
        step: 0.1,
        label: 'Floating Amplitude',
        onChange: (v) => {
          this.particles.forEach(
            (p) => (p.floatingAmplitude = 0.5 + MATH.random() * v),
          );
        },
      },
      'Smoke',
    );
  }

  recreateDome() {
    // Clean up existing mesh
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.scene.remove(this.mesh);
    }
    // Recreate with new config
    this.createDome();
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.scene.remove(this.mesh);
    }
  }
}
