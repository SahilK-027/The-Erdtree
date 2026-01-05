import * as THREE from 'three';
import Game from '../../Game.class';

export default class GlowPass {
  constructor() {
    this.game = Game.getInstance();
    this.sizes = this.game.sizes;

    this.createRenderTarget();
  }

  createRenderTarget() {
    const width = Math.max(1, Math.floor(this.sizes.width * 0.5));
    const height = Math.max(1, Math.floor(this.sizes.height * 0.5));
    
    this.renderTarget = new THREE.WebGLRenderTarget(
      width,
      height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
      }
    );
  }

  resize() {
    const width = Math.max(1, Math.floor(this.sizes.width * 0.5));
    const height = Math.max(1, Math.floor(this.sizes.height * 0.5));
    this.renderTarget.setSize(width, height);
  }

  destroy() {
    this.renderTarget.dispose();
  }
}
