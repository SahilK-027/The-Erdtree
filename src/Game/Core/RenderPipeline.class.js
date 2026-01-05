import Game from '../Game.class';
import PostProcessing from '../PostProcessing/PostProcessing.class';
import { PASS_CONFIG } from '../PostProcessing/LayerConfig.util';

export default class RenderPipeline {
  constructor() {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.camera = this.game.camera.cameraInstance;
    this.renderer = this.game.renderer.rendererInstance;
    this.sizes = this.game.sizes;

    this.postProcessing = new PostProcessing();
  }

  setCameraLayers(layersArray) {
    this.camera.layers.set(0);
    this.camera.layers.disable(0);
    layersArray.forEach((layer) => {
      this.camera.layers.enable(layer);
    });
  }

  setCameraToLayers(layersArray) {
    if (layersArray.length === 1) {
      this.camera.layers.set(layersArray[0]);
    } else {
      this.setCameraLayers(layersArray);
    }
  }

  render() {
    // PASS 1: Render only glow objects to render target
    this.setCameraToLayers(PASS_CONFIG.GLOW_CAPTURE);
    this.renderer.setRenderTarget(this.postProcessing.glowPass.renderTarget);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // PASS 2: Render bloom layer with bloom effect
    this.setCameraToLayers(PASS_CONFIG.BLOOM_RENDER);
    this.postProcessing.bloomPass.render();

    // PASS 3: Render the entire scene normally to the screen
    this.setCameraToLayers(PASS_CONFIG.MAIN_SCENE);
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    // PASS 4: Apply bloom composite additively on top
    this.renderer.autoClear = false;
    this.postProcessing.compositePass.renderBloom();

    // PASS 5: Apply post-processing glow effect additively on top
    this.postProcessing.compositePass.renderGlow();
    this.renderer.autoClear = true;
  }

  resize() {
    this.postProcessing.resize();
  }

  destroy() {
    this.postProcessing.destroy();
  }
}
