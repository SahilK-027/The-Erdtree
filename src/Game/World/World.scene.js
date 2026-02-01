import * as THREE from 'three';
import Game from '../Game.class';
import Lighting from './Components/Lighting/Lighting.class';
import Godrays from './Components/Godrays/Godrays.class';
import Erdtree from './Components/Erdtree/Erdtree.class';
import Ground from './Components/Ground/Ground.class';
import FallingLeaves from './Components/FallingLeaves/FallingLeaves.class';
import Smoke from './Components/Smoke/Smoke.class';
import FlowfieldParticles from './Components/FlowfieldParticles/FlowfieldParticles.class';
import Ruins from './Components/Ruins/Ruins.class';
import IntroSequence from './Components/IntroSequence/IntroSequence.class';

export default class World {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;

    this.scene.fog = new THREE.FogExp2(0x10271f, 0.11);
    this.ground = new Ground();
    this.godrays = new Godrays();
    this.erdtree = new Erdtree();

    // Set camera target to erdtree's visual center
    if (this.erdtree.visualCenter && this.game.camera) {
      this.game.camera.setTargetFromErdtree(this.erdtree.visualCenter);
    }

    this.ruins = new Ruins({
      positionX: 0,
      positionY: 0,
      positionZ: -9,
      debugFolder: 'Ruins 1',
    });

    this.ruins2 = new Ruins({
      scale: 0.5,
      positionX: -12.6,
      positionY: 0.0,
      positionZ: -2.2,
      rotationY: 2.32,
      debugFolder: 'Ruins 2',
    });

    this.fallingLeaves = new FallingLeaves();
    this.Smoke = new Smoke({
      radius: 5,
      segments: 9,
      rings: 2,
      planeSize: 2,
      randomOffset: 10.0,
      color: 0xffed9f,
      opacity: 0.5,
      yOffset: -1.8,
    });

    // Initialize flowfield particles after erdtree is created
    this.flowfieldParticles = new FlowfieldParticles(this.erdtree.model);

    this.lighting = new Lighting({ helperEnabled: false });

    // Initialize intro sequence
    this.introSequence = new IntroSequence();
  }

  update() {
    this.godrays.update();
    this.erdtree.update();
    this.fallingLeaves.update(this.game.time.delta);
    this.Smoke.update();
    this.flowfieldParticles.update();
  }
}
