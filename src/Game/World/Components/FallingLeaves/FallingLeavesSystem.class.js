import * as THREE from 'three';
import Game from '../../../Game.class';
import LeavesMaterial from '../Leaves/Leaves.class';
import { LAYERS } from '../../../PostProcessing/LayerConfig.util';

export default class FallingLeavesSystem {
  constructor(geometry, bounds) {
    this.game = Game.getInstance();
    this.count = 35;
    this.scene = this.game.scene;
    this.bounds = bounds;

    this.leavesMaterial = new LeavesMaterial();
    this.material = this.leavesMaterial.material;

    this.mesh = new THREE.InstancedMesh(geometry, this.material, this.count);
    this.mesh.scale.set(0.04, 0.04, 0.04);
    this.mesh.castShadow = true;
    this.mesh.layers.set(LAYERS.BLOOM);
    this.scene.add(this.mesh);

    this.dummy = new THREE.Object3D();
    this.particles = [];

    for (let i = 0; i < this.count; i++) {
      this.particles.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        rotSpeed: new THREE.Vector3(),
        scale: 1,
      });
      this.respawn(this.particles[i]);
      this.particles[i].pos.y =
        Math.random() * (bounds.yMax - bounds.yMin) + bounds.yMin;
    }
  }

  respawn(p) {
    p.pos.x = this.bounds.originX + (Math.random() - 0.5) * this.bounds.xRange;
    p.pos.y = this.bounds.yMax - Math.random();
    p.pos.z = this.bounds.originZ + (Math.random() - 0.5) * this.bounds.zRange;

    p.vel.set(
      (Math.random() - 0.2) * 0.05,
      -(Math.random() * 0.01 + 0.02),
      (Math.random() - 0.7) * 0.05,
    );

    p.rot.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    p.rotSpeed.set(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
    );

    p.scale = 0.0;
  }

  update(dt) {
    this.leavesMaterial.update(this.game.time.elapsed);
    
    const cappedDt = Math.min(dt, 0.1);
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];

      p.pos.addScaledVector(p.vel, cappedDt * 60);
      p.rot.x += p.rotSpeed.x * cappedDt * 60;
      p.rot.y += p.rotSpeed.y * cappedDt * 60;
      p.rot.z += p.rotSpeed.z * cappedDt * 60;

      if (p.scale < 0.8) {
        p.scale = THREE.MathUtils.lerp(
          p.scale,
          0.8,
          Math.min(cappedDt * 2.0, 1.0),
        );
      }

      p.pos.z -= Math.sin(p.pos.y) * 0.001 * cappedDt * 60;

      this.dummy.position.copy(p.pos);
      this.dummy.rotation.copy(p.rot);
      const s = p.scale;
      this.dummy.scale.set(s, s, s);
      this.dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this.dummy.matrix);

      if (p.pos.y < 10.0) {
        this.respawn(p);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
