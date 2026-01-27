import * as THREE from 'three';
import Game from '../Game.class';
import Lighting from './Components/Lighting/Lighting.class';
import Erdtree from './Components/Erdtree/Erdtree.class';

export default class World {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;

    /**
     * Scene objects
     */
    this.scene.fog = new THREE.FogExp2(0x121316, 0.075);
    this.erdtree = new Erdtree();

    this.lighting = new Lighting({ helperEnabled: false });
  }

  update() {
    this.erdtree.update();
  }
}
