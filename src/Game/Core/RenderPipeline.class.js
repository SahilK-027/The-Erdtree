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
    this.cachedLayerMasks = new Map();
    this.currentLayerMask = null;
    this.initializeLayerMasks();
  }

  initializeLayerMasks() {
    Object.keys(PASS_CONFIG).forEach((key) => {
      const layers = PASS_CONFIG[key];
      this.cachedLayerMasks.set(key, [...layers]);
    });
  }

  setCameraToLayers(layersArray) {
    const key = layersArray.slice().sort().join(',');
    
    if (this.currentLayerKey !== key) {
      if (layersArray.length === 1) {
        this.camera.layers.set(layersArray[0]);
      } else {
        this.camera.layers.disableAll();
        layersArray.forEach((layer) => {
          this.camera.layers.enable(layer);
        });
      }
      this.currentLayerKey = key;
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

    // PASS 4: Apply combined post-processing effects (bloom + glow) in single pass
    this.renderer.autoClear = false;
    this.postProcessing.compositePass.renderCombined();
    this.renderer.autoClear = true;
  }

  resize() {
    this.postProcessing.resize();
  }

  destroy() {
    this.postProcessing.destroy();
  }
}
