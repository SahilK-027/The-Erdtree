import * as THREE from 'three';
import Game from '../../Game.class';

export default class GlowPass {
  constructor() {
    this.game = Game.getInstance();
    this.sizes = this.game.sizes;

    this.createRenderTarget();
  }

  createRenderTarget() {
    this.renderTarget = new THREE.WebGLRenderTarget(
      this.sizes.width,
      this.sizes.height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      }
    );
  }

  resize() {
    this.renderTarget.setSize(this.sizes.width, this.sizes.height);
  }

  destroy() {
    this.renderTarget.dispose();
  }
}
