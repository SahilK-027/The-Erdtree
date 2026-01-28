import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { getSimulationShader } from './simulationShader.js';
import flowfieldVertexShader from '../../../../Shaders/Particles/flowfield.vert.glsl';
import flowfieldFragmentShader from '../../../../Shaders/Particles/flowfield.frag.glsl';

export class FlowfieldParticleSystem {
  constructor(erdtreeVertices, erdtreeMesh, scene, renderer) {
    this.erdtreeVertices = erdtreeVertices;
    this.erdtreeMesh = erdtreeMesh;
    this.scene = scene;
    this.renderer = renderer;

    this.WIDTH = 50;
    this.PARTICLES = this.WIDTH * this.WIDTH;

    // Collect mesh data for surface sampling
    this.meshes = [];
    this.erdtreeMesh.traverse((child) => {
      if (child.isMesh) {
        this.meshes.push(child);
      }
    });

    this.init();
  }

  init() {
    this.gpuCompute = new GPUComputationRenderer(
      this.WIDTH,
      this.WIDTH,
      this.renderer
    );

    const dtPosition = this.gpuCompute.createTexture();
    this.fillInitialPositions(dtPosition);

    this.positionVariable = this.gpuCompute.addVariable(
      'uParticles',
      getSimulationShader(),
      dtPosition
    );

    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
    ]);

    this.positionVariable.material.uniforms.uTime = { value: 0 };
    this.positionVariable.material.uniforms.uDeltaTime = { value: 0 };
    this.positionVariable.material.uniforms.uBase = { value: dtPosition };
    this.positionVariable.material.uniforms.uInfluence = { value: 0.95 };
    this.positionVariable.material.uniforms.uStrength = { value: 0.35 };
    this.positionVariable.material.uniforms.uFrequency = { value: 0.8 };
    this.positionVariable.material.uniforms.uErdtreePosition = {
      value: new THREE.Vector3(0, 0.5, 0),
    };

    const error = this.gpuCompute.init();
    if (error !== null) console.error(error);

    this.createParticleGeometry();
    this.createParticleMaterial();

    this.particleSystem = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    
    // Disable frustum culling to prevent particles from disappearing
    this.particleSystem.frustumCulled = false;
    
    this.scene.add(this.particleSystem);
  }

  fillInitialPositions(dtPosition) {
    const posArray = dtPosition.image.data;

    // Reuse vectors for performance
    const tempPosition = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const n1 = new THREE.Vector3();
    const n2 = new THREE.Vector3();
    const n3 = new THREE.Vector3();

    if (this.meshes.length === 0) return;

    // Calculate mesh weights based on vertex count
    const meshWeights = this.meshes.map((mesh) => {
      const posAttr = mesh.geometry.attributes.position;
      return posAttr ? posAttr.count : 0;
    });
    const totalWeight = meshWeights.reduce((a, b) => a + b, 0);

    for (let k = 0; k < posArray.length; k += 4) {
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

      // Random barycentric coordinates for uniform distribution
      const r1 = Math.random();
      const r2 = Math.random();
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

      // Offset along normal based on height for mystical effect
      const heightRatio = (tempPosition.y + 1.0) / 3.0;
      let normalOffset;

      if (heightRatio > 0.7) {
        // Upper canopy - larger offset, radiate outward for crown glow
        normalOffset = 0.2 + Math.random() * 0.4;
      } else if (heightRatio > 0.5) {
        // Upper-mid section - medium-large offset
        normalOffset = 0.12 + Math.random() * 0.25;
      } else if (heightRatio > 0.3) {
        // Mid-section - medium offset
        normalOffset = 0.06 + Math.random() * 0.15;
      } else if (heightRatio > 0.15) {
        // Lower trunk - small offset
        normalOffset = 0.03 + Math.random() * 0.08;
      } else {
        // Base - very small offset, stay close to surface
        normalOffset = 0.01 + Math.random() * 0.04;
      }

      tempPosition.x += tempNormal.x * normalOffset;
      tempPosition.y += tempNormal.y * normalOffset;
      tempPosition.z += tempNormal.z * normalOffset;

      // Add subtle randomness
      tempPosition.x += (Math.random() - 0.5) * 0.02;
      tempPosition.y += (Math.random() - 0.5) * 0.02;
      tempPosition.z += (Math.random() - 0.5) * 0.02;

      posArray[k + 0] = tempPosition.x;
      posArray[k + 1] = tempPosition.y;
      posArray[k + 2] = tempPosition.z;
      posArray[k + 3] = Math.random(); // Lifecycle offset
    }
  }

  createParticleGeometry() {
    this.particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.PARTICLES * 3);
    const uvs = new Float32Array(this.PARTICLES * 2);

    for (let i = 0; i < this.PARTICLES; i++) {
      uvs[i * 2] = (i % this.WIDTH) / this.WIDTH;
      uvs[i * 2 + 1] = Math.floor(i / this.WIDTH) / this.WIDTH;
    }

    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.particleGeometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(uvs, 2)
    );
  }

  createParticleMaterial() {
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPositions: { value: null },
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 6.0 },
        uColor1: { value: new THREE.Color(0xffd700) },
        uColor2: { value: new THREE.Color(0xffed9f) },
        uColor3: { value: new THREE.Color(0xffa500) },
      },
      vertexShader: flowfieldVertexShader,
      fragmentShader: flowfieldFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  update(deltaTime, elapsedTime) {
    this.positionVariable.material.uniforms.uTime.value = elapsedTime * 0.1;
    this.positionVariable.material.uniforms.uDeltaTime.value = deltaTime;
    this.positionVariable.material.uniforms.uErdtreePosition.value.copy(
      this.erdtreeMesh.position
    );

    this.gpuCompute.compute();

    this.particleMaterial.uniforms.uPositions.value =
      this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
    this.particleMaterial.uniforms.uTime.value = elapsedTime;
  }

  getUniforms() {
    return this.positionVariable.material.uniforms;
  }

  getMaterial() {
    return this.particleMaterial;
  }

  destroy() {
    this.particleGeometry?.dispose();
    this.particleMaterial?.dispose();
    this.scene.remove(this.particleSystem);
  }
}
