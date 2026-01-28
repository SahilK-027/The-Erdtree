import * as THREE from 'three';
import Game from '../Game.class';
import Lighting from './Components/Lighting/Lighting.class';
import Godrays from './Components/Godrays/Godrays.class';
import Erdtree from './Components/Erdtree/Erdtree.class';
import Ground from './Components/Ground/Ground.class';
import FallingLeaves from './Components/FallingLeaves/FallingLeaves.class';

export default class World {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;

    this.scene.fog = new THREE.FogExp2(0x10271f, 0.075);
    this.ground = new Ground();
    this.godrays = new Godrays();
    this.erdtree = new Erdtree();
    this.fallingLeaves = new FallingLeaves();

    this.lighting = new Lighting({ helperEnabled: false });
  }

  update() {
    this.godrays.update();
    this.erdtree.update();
    this.fallingLeaves.update(this.game.time.delta);
  }
}
