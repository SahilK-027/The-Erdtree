import * as THREE from 'three';
import Game from '../Game.class';
import Lighting from './Components/Lighting/Lighting.class';
import Godrays from './Components/Godrays/Godrays.class';
import Erdtree from './Components/Erdtree/Erdtree.class';
import Ground from './Components/Ground/Ground.class';
import FallingLeaves from './Components/FallingLeaves/FallingLeaves.class';
import Smoke from './Components/Smoke/Smoke.class';

export default class World {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;

    this.scene.fog = new THREE.FogExp2(0x10271f, 0.1);
    this.ground = new Ground();
    this.godrays = new Godrays();
    this.erdtree = new Erdtree();
    this.fallingLeaves = new FallingLeaves();
    this.Smoke = new Smoke({
      radius: 5,
      segments: 9,
      rings: 3,
      planeSize: 5,
      randomOffset: 10.0,
      color: 0xffed9f,
      opacity: 1.0,
      yOffset: -1.8
    });

    this.lighting = new Lighting({ helperEnabled: false });
  }

  update() {
    this.godrays.update();
    this.erdtree.update();
    this.fallingLeaves.update(this.game.time.delta);
    this.Smoke.update();
  }
}
