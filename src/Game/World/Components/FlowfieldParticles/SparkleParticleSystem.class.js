import * as THREE from 'three';
import sparkleVertexShader from '../../../../Shaders/Particles/sparkle.vert.glsl';
import sparkleFragmentShader from '../../../../Shaders/Particles/sparkle.frag.glsl';

export class SparkleParticleSystem {
  constructor(scene, erdtreeMesh = null) {
    this.scene = scene;
    this.erdtreeMesh = erdtreeMesh;
    this.sparkleCount = 500;

    // Collect mesh data for surface sampling
    this.meshes = [];
    if (this.erdtreeMesh) {
      this.erdtreeMesh.traverse((child) => {
        if (child.isMesh) {
          this.meshes.push(child);
        }
      });
    }

    this.init();
  }

  init() {
    this.createGeometry();
    this.createMaterial();
    this.sparkles = new THREE.Points(this.geometry, this.material);
    
    // Disable frustum culling to prevent sparkles from disappearing
    this.sparkles.frustumCulled = false;
    
    this.scene.add(this.sparkles);
  }

  createGeometry() {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sparkleCount * 3);
    const randoms = new Float32Array(this.sparkleCount);

    // Reuse vectors for performance
    const tempPosition = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const n1 = new THREE.Vector3();
    const n2 = new THREE.Vector3();
    const n3 = new THREE.Vector3();

    if (this.meshes.length > 0) {
      // Calculate mesh weights
      const meshWeights = this.meshes.map((mesh) => {
        const posAttr = mesh.geometry.attributes.position;
        return posAttr ? posAttr.count : 0;
      });
      const totalWeight = meshWeights.reduce((a, b) => a + b, 0);

      for (let i = 0; i < this.sparkleCount; i++) {
        // Pick a random mesh weighted by surface area
        let random = Math.random() * totalWeight;
        let meshIndex = 0;
        for (let j = 0; j < meshWeights.length; j++) {
          random -= meshWeights[j];
          if (random <= 0) {
            meshIndex = j;
            break;
          }
        }

        const mesh = this.meshes[meshIndex];
        const geometry = mesh.geometry;
        const positionAttribute = geometry.attributes.position;
        const normalAttribute = geometry.attributes.normal;

        if (!positionAttribute) continue;

        // Pick a random triangle
        const triangleCount = Math.floor(positionAttribute.count / 3);
        const triangleIndex = Math.floor(Math.random() * triangleCount) * 3;

        // Get triangle vertices
        v1.fromBufferAttribute(positionAttribute, triangleIndex);
        v2.fromBufferAttribute(positionAttribute, triangleIndex + 1);
        v3.fromBufferAttribute(positionAttribute, triangleIndex + 2);

        // Get triangle normals
        if (normalAttribute) {
          n1.fromBufferAttribute(normalAttribute, triangleIndex);
          n2.fromBufferAttribute(normalAttribute, triangleIndex + 1);
          n3.fromBufferAttribute(normalAttribute, triangleIndex + 2);
        } else {
          n1.set(0, 1, 0);
          n2.set(0, 1, 0);
          n3.set(0, 1, 0);
        }

        // Random barycentric coordinates with bias toward edges for sparkles
        const r1 = Math.pow(Math.random(), 0.7); // Bias toward edges
        const r2 = Math.pow(Math.random(), 0.7);
        const sqrtR1 = Math.sqrt(r1);
        const w1 = 1 - sqrtR1;
        const w2 = sqrtR1 * (1 - r2);
        const w3 = sqrtR1 * r2;

        // Interpolate position
        tempPosition.set(
          v1.x * w1 + v2.x * w2 + v3.x * w3,
          v1.y * w1 + v2.y * w2 + v3.y * w3,
          v1.z * w1 + v2.z * w2 + v3.z * w3
        );

        // Interpolate normal
        tempNormal.set(
          n1.x * w1 + n2.x * w2 + n3.x * w3,
          n1.y * w1 + n2.y * w2 + n3.y * w3,
          n1.z * w1 + n2.z * w2 + n3.z * w3
        );
        tempNormal.normalize();

        // Transform to world space
        mesh.localToWorld(tempPosition);
        tempNormal.transformDirection(mesh.matrixWorld);

        // Offset along normal - sparkles float further from surface
        const heightRatio = (tempPosition.y + 1.0) / 3.0;
        let normalOffset;

        if (heightRatio > 0.65) {
          // Upper canopy - large offset for glowing crown
          normalOffset = 0.3 + Math.random() * 0.5;
        } else if (heightRatio > 0.45) {
          // Upper-mid section - medium-large offset
          normalOffset = 0.2 + Math.random() * 0.35;
        } else if (heightRatio > 0.25) {
          // Mid-section - medium offset
          normalOffset = 0.12 + Math.random() * 0.25;
        } else {
          // Lower section - smaller offset
          normalOffset = 0.06 + Math.random() * 0.15;
        }

        tempPosition.x += tempNormal.x * normalOffset;
        tempPosition.y += tempNormal.y * normalOffset;
        tempPosition.z += tempNormal.z * normalOffset;

        // Add variation for sparkle spread
        tempPosition.x += (Math.random() - 0.5) * 0.12;
        tempPosition.y += (Math.random() - 0.5) * 0.12;
        tempPosition.z += (Math.random() - 0.5) * 0.12;

        positions[i * 3] = tempPosition.x;
        positions[i * 3 + 1] = tempPosition.y;
        positions[i * 3 + 2] = tempPosition.z;

        randoms[i] = Math.random();
      }
    } else {
      // Fallback: spherical distribution
      for (let i = 0; i < this.sparkleCount; i++) {
        const pattern = Math.random();
        let x, y, z;

        if (pattern < 0.4) {
          const radius = 0.3 + Math.random() * 1.2;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI * 0.3;

          x = radius * Math.sin(phi) * Math.cos(theta);
          y = 1.5 + radius * Math.cos(phi) + Math.random() * 0.8;
          z = radius * Math.sin(phi) * Math.sin(theta);
        } else if (pattern < 0.7) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.8 + Math.random() * 1.5;
          const layer = Math.floor(Math.random() * 4) * 0.5;

          x = Math.cos(angle) * radius;
          y = 0.2 + layer + (Math.random() - 0.5) * 0.3;
          z = Math.sin(angle) * radius;
        } else {
          const radius = 2.0 + Math.random() * 1.0;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          x = radius * Math.sin(phi) * Math.cos(theta);
          y = radius * Math.sin(phi) * Math.sin(theta) + 0.5;
          z = radius * Math.cos(phi);
        }

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        randoms[i] = Math.random();
      }
    }

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute(
      'aRandom',
      new THREE.BufferAttribute(randoms, 1)
    );
  }

  createMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 1.5 },
        uColor: { value: new THREE.Color(0xfe9a08) },
      },
      vertexShader: sparkleVertexShader,
      fragmentShader: sparkleFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  update(elapsedTime) {
    this.material.uniforms.uTime.value = elapsedTime;
  }

  destroy() {
    this.geometry?.dispose();
    this.material?.dispose();
    this.scene.remove(this.sparkles);
  }
}
