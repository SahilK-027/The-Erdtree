import * as THREE from 'three';
import Game from '../../../Game.class';

export default class Ground {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;

    this.createGround();
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshStandardMaterial({
      color: 0x32271b,
      roughness: 0.9,
      metalness: 0.1,
      fog: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;

    this.scene.add(this.mesh);
  }
}
