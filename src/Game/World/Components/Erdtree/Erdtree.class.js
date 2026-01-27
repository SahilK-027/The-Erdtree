import * as THREE from 'three';
import Game from '../../../Game.class';
import { LAYERS } from '../../../PostProcessing/LayerConfig.util';
import vertexShaderErdTree from '../../../../Shaders/Erdtree/vertex.glsl';
import fragmentShaderErdTree from '../../../../Shaders/Erdtree/fragment.glsl';
import * as MATH from '../../../Utils/Math.class';
import LeavesMaterial from '../Leaves/Leaves.class';

export default class Erdtree {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.resources = this.game.resources;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.params = {
      scale: 1.125,
      positionY: -0.1,
      rotationY: 1.4,
      baseColor: '#918869',
      fresnelColor: '#cbc5a2',
      fresnelPower: 1.0,
      fresnelIntensity: 1.5,
      trunkFadeStart: 0.2,
      trunkFadeEnd: 0.5,
      trunkOpacity: 0.2,
      glowIntensity: 0.8,
      leafCount: 16000,
      leafScale: 0.02,
      leafMinHeight: 0.75,
      leafRandomness: 0.01,
      leafNormalOffset: 0.08,
      leafRadialBias: 0.7,
      lodDistance: 10,
    };

    // Initialize leaf material
    this.leavesMaterial = new LeavesMaterial(this.debug, this.isDebugEnabled);

    this.setup();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  setup() {
    if (!this.resources || !this.resources.items) {
      console.error('Resources not available:', this.resources);
      return;
    }

    const gltf = this.resources.items.erdtreeModel;
    if (!gltf) {
      console.error('Erdtree model not loaded');
      return;
    }

    this.model = gltf.scene;

    this.createShaderMaterial();

    this.model.traverse((child) => {
      if (child.isMesh) {
        child.layers.set(LAYERS.BLOOM);
        child.material = this.shaderMaterial;
      }
    });

    this.model.scale.setScalar(this.params.scale);
    this.model.position.y = this.params.positionY;
    this.model.rotation.set(
      0,
      this.params.rotationY,
      0,
    );
    this.scene.add(this.model);

    this.createInstancedLeaves();
  }

  createShaderMaterial() {
    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBaseColor: { value: new THREE.Color(this.params.baseColor) },
        uFresnelColor: { value: new THREE.Color(this.params.fresnelColor) },
        uFresnelPower: { value: this.params.fresnelPower },
        uFresnelIntensity: { value: this.params.fresnelIntensity },
        uTrunkFadeStart: { value: this.params.trunkFadeStart },
        uTrunkFadeEnd: { value: this.params.trunkFadeEnd },
        uTrunkOpacity: { value: this.params.trunkOpacity },
        uGlowIntensity: { value: this.params.glowIntensity },
      },
      vertexShader: vertexShaderErdTree,
      fragmentShader: fragmentShaderErdTree,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }

  createInstancedLeaves() {
    const leafGltf = this.resources.items.leafModel;
    if (!leafGltf) {
      console.warn('Leaf model not loaded');
      return;
    }

    // Extract leaf geometry and material
    let leafGeometry = null;
    let leafMaterial = null;

    leafGltf.scene.traverse((child) => {
      if (child.isMesh && !leafGeometry) {
        leafGeometry = child.geometry;
        leafMaterial = child.material;
      }
    });

    if (!leafGeometry) {
      console.warn('No geometry found in leaf model');
      return;
    }

    // Use custom shader material for leaves
    leafMaterial = this.leavesMaterial.material;

    // Sample positions from erdtree mesh
    const positions = this.samplePositionsOnTree(this.params.leafCount);

    // Create instanced mesh
    this.instancedLeaves = new THREE.InstancedMesh(
      leafGeometry,
      leafMaterial,
      this.params.leafCount,
    );

    // Performance optimizations
    this.instancedLeaves.frustumCulled = true; // Enable frustum culling
    this.instancedLeaves.instanceMatrix.setUsage(THREE.StaticDrawUsage); // Static - animation is in shader

    // Set up instances
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    positions.forEach((pos, i) => {
      position.copy(pos);

      // Random rotation for variety
      rotation.set(
        MATH.random() * Math.PI * 2,
        MATH.random() * Math.PI * 2,
        MATH.random() * Math.PI * 2,
      );
      quaternion.setFromEuler(rotation);

      // Scale with slight randomness
      const scaleValue = this.params.leafScale * (0.8 + MATH.random() * 0.4);
      scale.set(scaleValue, scaleValue, scaleValue);

      matrix.compose(position, quaternion, scale);
      this.instancedLeaves.setMatrixAt(i, matrix);
    });

    this.instancedLeaves.instanceMatrix.needsUpdate = true;
    this.instancedLeaves.layers.set(LAYERS.BLOOM);

    // Compute bounding sphere for better frustum culling
    this.instancedLeaves.computeBoundingSphere();

    this.scene.add(this.instancedLeaves);
  }

  createLowDetailLeaves(count) {
    if (!this.instancedLeaves) return null;

    const geometry = this.instancedLeaves.geometry;
    const material = this.instancedLeaves.material;

    const lowDetailMesh = new THREE.InstancedMesh(geometry, material, count);

    lowDetailMesh.frustumCulled = true;
    lowDetailMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    // Copy every Nth matrix from the full detail mesh
    const step = Math.floor(this.params.leafCount / count);
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < count; i++) {
      const sourceIndex = i * step;
      this.instancedLeaves.getMatrixAt(sourceIndex, matrix);
      lowDetailMesh.setMatrixAt(i, matrix);
    }

    lowDetailMesh.instanceMatrix.needsUpdate = true;
    lowDetailMesh.layers.set(LAYERS.BLOOM);
    lowDetailMesh.computeBoundingSphere();

    return lowDetailMesh;
  }

  samplePositionsOnTree(count) {
    const positions = [];

    // Reuse objects to reduce GC pressure
    const tempPosition = new THREE.Vector3();
    const tempNormal = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const n1 = new THREE.Vector3();
    const n2 = new THREE.Vector3();
    const n3 = new THREE.Vector3();

    // Collect all mesh geometries from the erdtree
    const meshes = [];
    this.model.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });

    if (meshes.length === 0) return positions;

    // Pre-calculate mesh weights based on surface area for better distribution
    const meshWeights = meshes.map((mesh) => {
      const posAttr = mesh.geometry.attributes.position;
      return posAttr ? posAttr.count : 0;
    });
    const totalWeight = meshWeights.reduce((a, b) => a + b, 0);

    // Sample random points on the tree surface
    let attempts = 0;
    const maxAttempts = count * 3;

    for (let i = 0; i < count && attempts < maxAttempts; i++) {
      attempts++;

      // Pick a random mesh weighted by surface area
      let random = MATH.random() * totalWeight;
      let meshIndex = 0;
      for (let j = 0; j < meshWeights.length; j++) {
        random -= meshWeights[j];
        if (random <= 0) {
          meshIndex = j;
          break;
        }
      }

      const mesh = meshes[meshIndex];
      const geometry = mesh.geometry;
      const positionAttribute = geometry.attributes.position;
      const normalAttribute = geometry.attributes.normal;

      if (!positionAttribute) continue;

      // Pick a random triangle
      const triangleCount = Math.floor(positionAttribute.count / 3);
      const triangleIndex = Math.floor(MATH.random() * triangleCount) * 3;

      // Get triangle vertices (reuse vectors)
      v1.fromBufferAttribute(positionAttribute, triangleIndex);
      v2.fromBufferAttribute(positionAttribute, triangleIndex + 1);
      v3.fromBufferAttribute(positionAttribute, triangleIndex + 2);

      // Get triangle normals (reuse vectors)
      if (normalAttribute) {
        n1.fromBufferAttribute(normalAttribute, triangleIndex);
        n2.fromBufferAttribute(normalAttribute, triangleIndex + 1);
        n3.fromBufferAttribute(normalAttribute, triangleIndex + 2);
      } else {
        n1.set(0, 1, 0);
        n2.set(0, 1, 0);
        n3.set(0, 1, 0);
      }

      // Random barycentric coordinates with bias toward edges
      const r1 = Math.pow(MATH.random(), this.params.leafRadialBias);
      const r2 = Math.pow(MATH.random(), this.params.leafRadialBias);
      const sqrtR1 = Math.sqrt(r1);
      const w1 = 1 - sqrtR1;
      const w2 = sqrtR1 * (1 - r2);
      const w3 = sqrtR1 * r2;

      // Interpolate position
      tempPosition.set(
        v1.x * w1 + v2.x * w2 + v3.x * w3,
        v1.y * w1 + v2.y * w2 + v3.y * w3,
        v1.z * w1 + v2.z * w2 + v3.z * w3,
      );

      // Interpolate normal
      tempNormal.set(
        n1.x * w1 + n2.x * w2 + n3.x * w3,
        n1.y * w1 + n2.y * w2 + n3.y * w3,
        n1.z * w1 + n2.z * w2 + n3.z * w3,
      );
      tempNormal.normalize();

      // Transform to world space
      mesh.localToWorld(tempPosition);
      tempNormal.transformDirection(mesh.matrixWorld);

      // Calculate distance from center (trunk)
      const distanceFromCenter = Math.sqrt(
        tempPosition.x * tempPosition.x + tempPosition.z * tempPosition.z,
      );

      // Filter by height and distance (favor outer branches)
      // Allow leaves closer to center at higher Y positions (top of tree)
      const minDistanceAtHeight = Math.max(
        0,
        0.2 - (tempPosition.y - this.params.leafMinHeight) * 0.15,
      );

      if (
        tempPosition.y >= this.params.leafMinHeight &&
        distanceFromCenter > minDistanceAtHeight
      ) {
        // Offset along normal (push leaves away from surface)
        tempPosition.x += tempNormal.x * this.params.leafNormalOffset;
        tempPosition.y += tempNormal.y * this.params.leafNormalOffset;
        tempPosition.z += tempNormal.z * this.params.leafNormalOffset;

        // Add some randomness to position
        tempPosition.x += (MATH.random() - 0.5) * this.params.leafRandomness;
        tempPosition.y += (MATH.random() - 0.5) * this.params.leafRandomness;
        tempPosition.z += (MATH.random() - 0.5) * this.params.leafRandomness;

        positions.push(tempPosition.clone());
      } else {
        // Try again if conditions not met
        i--;
      }
    }

    return positions;
  }

  updateLeaves() {
    if (this.instancedLeaves) {
      this.scene.remove(this.instancedLeaves);
      this.instancedLeaves.geometry?.dispose();
      this.instancedLeaves.dispose();
    }
    if (this.leafLOD) {
      this.scene.remove(this.leafLOD);
      // Dispose LOD levels
      this.leafLOD.levels.forEach((level) => {
        if (level.object && level.object !== this.instancedLeaves) {
          level.object.geometry?.dispose();
          level.object.dispose();
        }
      });
      this.leafLOD = null;
    }
    this.createInstancedLeaves();
  }

  update() {
    // Update leaves animation
    if (this.leavesMaterial && this.game.time) {
      this.leavesMaterial.update(this.game.time.elapsed);
    }

    // Update LOD based on camera distance
    if (this.leafLOD && this.game.camera) {
      this.leafLOD.update(this.game.camera.cameraInstance);
    }
  }

  initTweakPane() {
    const folder = 'Erdtree';

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

    this.debug.add(
      this.params,
      'baseColor',
      {
        label: 'Base Color',
        onChange: (v) => {
          this.shaderMaterial.uniforms.uBaseColor.value.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'fresnelColor',
      {
        label: 'Fresnel Color',
        onChange: (v) => {
          this.shaderMaterial.uniforms.uFresnelColor.value.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'fresnelPower',
      {
        label: 'Fresnel Power',
        min: 0.1,
        max: 10,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uFresnelPower.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'fresnelIntensity',
      {
        label: 'Fresnel Intensity',
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uFresnelIntensity.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'trunkFadeStart',
      {
        label: 'Trunk Fade Start',
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uTrunkFadeStart.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'trunkFadeEnd',
      {
        label: 'Trunk Fade End',
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uTrunkFadeEnd.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'trunkOpacity',
      {
        label: 'Trunk Opacity',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uTrunkOpacity.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'glowIntensity',
      {
        label: 'Glow Intensity',
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          this.shaderMaterial.uniforms.uGlowIntensity.value = v;
        },
      },
      folder,
    );

    // Leaf controls
    this.debug.add(
      this.params,
      'leafCount',
      {
        label: 'Leaf Count',
        min: 0,
        max: 2000,
        step: 50,
        onChange: () => {
          this.updateLeaves();
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'leafScale',
      {
        label: 'Leaf Scale',
        min: 0.05,
        max: 0.5,
        step: 0.01,
        onChange: () => {
          this.updateLeaves();
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'leafMinHeight',
      {
        label: 'Leaf Min Height',
        min: -1,
        max: 3,
        step: 0.1,
        onChange: () => {
          this.updateLeaves();
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'leafRandomness',
      {
        label: 'Leaf Randomness',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: () => {
          this.updateLeaves();
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'leafNormalOffset',
      {
        label: 'Leaf Normal Offset',
        min: 0,
        max: 0.5,
        step: 0.01,
        onChange: () => {
          this.updateLeaves();
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'leafRadialBias',
      {
        label: 'Leaf Radial Bias',
        min: 0.1,
        max: 2,
        step: 0.1,
        onChange: () => {
          this.updateLeaves();
        },
      },
      folder,
    );
  }

  destroy() {
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
      }
    });
    this.shaderMaterial?.dispose();
    this.scene.remove(this.model);

    if (this.instancedLeaves) {
      this.instancedLeaves.geometry?.dispose();
      this.instancedLeaves.dispose();
      this.scene.remove(this.instancedLeaves);
    }

    if (this.leafLOD) {
      this.leafLOD.levels.forEach((level) => {
        if (level.object) {
          level.object.geometry?.dispose();
          level.object.dispose();
        }
      });
      this.scene.remove(this.leafLOD);
    }

    // Dispose leaf material
    this.leavesMaterial?.dispose();
  }
}
