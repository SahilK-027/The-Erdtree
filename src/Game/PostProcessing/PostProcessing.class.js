import Game from '../Game.class';
import BloomPass from './Passes/BloomPass.class';
import GlowPass from './Passes/GlowPass.class';
import CompositePass from './Passes/CompositePass.class';
import { LAYERS } from './LayerConfig.util';

export default class PostProcessing {
  constructor() {
    this.game = Game.getInstance();
    this.camera = this.game.camera.cameraInstance;

    // Enable all layers we're using
    this.setCameraLayers(Object.values(LAYERS));

    this.glowPass = new GlowPass();
    this.bloomPass = new BloomPass();
    this.compositePass = new CompositePass(this.bloomPass, this.glowPass);
  }

  setCameraLayers(layersArray) {
    layersArray.forEach((layer) => {
      this.camera.layers.enable(layer);
    });
  }

  resize() {
    this.glowPass.resize();
    this.bloomPass.resize();
    this.compositePass.resize();
  }

  destroy() {
    this.glowPass.destroy();
    this.bloomPass.destroy();
    this.compositePass.destroy();
  }
}
