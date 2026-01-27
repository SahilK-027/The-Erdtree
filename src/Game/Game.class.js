import * as THREE from 'three';
import Sizes from './Utils/Sizes.class';
import Time from './Utils/Time.class';
import Camera from './Core/Camera.class';
import Renderer from './Core/Renderer.class';
import World from './World/World.scene';
import DebugPane from './Utils/DebugPane.class';
import RenderPipeline from './Core/RenderPipeline.class';

export default class Game {
  constructor(canvas, resources, debugMode) {
    // Singleton
    if (Game.instance) {
      return Game.instance;
    }
    Game.instance = this;

    this.isDebugEnabled = debugMode;
    if (this.isDebugEnabled) {
      this.debug = new DebugPane();
    }

    this.canvas = canvas;
    this.resources = resources;

    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.world = new World();

    this.renderPipeline = new RenderPipeline({
      game: this,
      renderer: this.renderer,
      camera: this.camera,
      scene: this.scene,
    });

    this.time.on('animate', () => {
      this.update();
    });
    this.sizes.on('resize', () => {
      this.resize();
    });
  }

  static getInstance() {
    if (!Game.instance) {
      throw new Error('Game instance not initialized. Call new Game(canvas, resources, debugMode) first.');
    }
    return Game.instance;
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
    this.renderPipeline.resize();
  }

  update() {
    this.camera.update();
    this.world.update();

    if (this.renderer.perf) {
      this.renderer.perf.beginFrame();
    }

    this.renderPipeline.render();

    if (this.renderer.perf) {
      this.renderer.perf.endFrame();
    }
  }

  destroy() {
    this.sizes.off('resize');
    this.time.off('animate');

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        for (const key in child.material) {
          const value = child.material[key];

          if (typeof value?.dispose === 'function') {
            value.dispose();
          }
        }
      }
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        mats.forEach((m) => {
          for (const key in m) {
            const prop = m[key];
            if (prop && prop.isTexture) prop.dispose();
          }
          m.dispose();
        });
      }
    });

    this.camera.controls.dispose();
    this.renderer.rendererInstance.dispose();
    if (this.debug) this.debug.dispose();

    this.canvas = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.world = null;
    this.debug = null;
  }
}
