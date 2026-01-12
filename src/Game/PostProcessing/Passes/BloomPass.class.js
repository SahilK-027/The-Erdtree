import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import Game from '../../Game.class';

export default class BloomPass {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.camera = this.game.camera.cameraInstance;
    this.renderer = this.game.renderer.rendererInstance;
    this.sizes = this.game.sizes;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.params = {
      strength: 0.2,
      radius: 0.4,
      threshold: 0.0,
    };

    this.createRenderTarget();
    this.createComposer();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
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

  createComposer() {
    this.composer = new EffectComposer(this.renderer, this.renderTarget);
    this.composer.renderToScreen = false;

    // Render pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Bloom pass
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      this.params.strength,
      this.params.radius,
      this.params.threshold
    );
    this.composer.addPass(this.bloomPass);
  }

  render() {
    this.composer.render();
  }

  resize() {
    this.renderTarget.setSize(this.sizes.width, this.sizes.height);
    this.composer.setSize(this.sizes.width, this.sizes.height);
    this.bloomPass.resolution.set(this.sizes.width, this.sizes.height);
  }

  initTweakPane() {
    const folder = 'Bloom';

    this.debug.add(this.params, 'strength', {
      label: 'Strength',
      min: 0,
      max: 5,
      step: 0.01,
      onChange: (v) => { this.bloomPass.strength = v; },
    }, folder);

    this.debug.add(this.params, 'radius', {
      label: 'Radius',
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v) => { this.bloomPass.radius = v; },
    }, folder);

    this.debug.add(this.params, 'threshold', {
      label: 'Threshold',
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => { this.bloomPass.threshold = v; },
    }, folder);
  }

  destroy() {
    this.renderTarget.dispose();
    this.composer.dispose();
  }
}
