import * as THREE from 'three';
import Game from '../../Game.class';
import vertexShader from '../../../Shaders/Bloom/vertex.glsl';
import fragmentBlur from '../../../Shaders/Bloom/fragmentBlur.glsl';
import fragmentThreshold from '../../../Shaders/Bloom/fragmentThreshold.glsl';

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
      strength: 0.01,
      radius: 1.0,
      threshold: 0.0,
      smoothing: 0.1,
      iterations: 2, // Number of blur passes (2 = 4 total passes)
    };

    this.createRenderTargets();
    this.createMaterials();
    this.createScene();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  createRenderTargets() {
    // OPTIMIZATION: Render bloom at lower resolution
    const bloomResolutionScale = 0.5;
    const width = Math.floor(this.sizes.width * bloomResolutionScale);
    const height = Math.floor(this.sizes.height * bloomResolutionScale);
    
    this.bloomResolutionScale = bloomResolutionScale;

    const rtOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
    };

    // Ping-pong render targets for blur passes
    this.renderTarget1 = new THREE.WebGLRenderTarget(width, height, rtOptions);
    this.renderTarget2 = new THREE.WebGLRenderTarget(width, height, rtOptions);
    
    // Final output target
    this.renderTarget = this.renderTarget2;
  }

  createMaterials() {
    // Threshold material
    this.thresholdMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uThreshold: { value: this.params.threshold },
        uSmoothing: { value: this.params.smoothing },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentThreshold,
    });

    // Blur material
    this.blurMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uResolution: { value: new THREE.Vector2(
          Math.floor(this.sizes.width * this.bloomResolutionScale),
          Math.floor(this.sizes.height * this.bloomResolutionScale)
        )},
        uDirection: { value: new THREE.Vector2(1, 0) },
        uStrength: { value: this.params.strength },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentBlur,
    });
  }

  createScene() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    
    this.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.thresholdMaterial
    );
    this.scene.add(this.quad);
  }

  render() {
    // Input is already in renderTarget1 from the pipeline
    // PASS 1: Apply threshold to isolate bright areas
    this.quad.material = this.thresholdMaterial;
    this.thresholdMaterial.uniforms.tDiffuse.value = this.renderTarget1.texture;
    this.thresholdMaterial.uniforms.uThreshold.value = this.params.threshold;
    this.thresholdMaterial.uniforms.uSmoothing.value = this.params.smoothing;
    
    this.renderer.setRenderTarget(this.renderTarget2);
    this.renderer.render(this.scene, this.camera);

    // PASS 2-N: Ping-pong blur passes
    this.quad.material = this.blurMaterial;
    this.blurMaterial.uniforms.uStrength.value = this.params.strength;
    
    let readTarget = this.renderTarget2;
    let writeTarget = this.renderTarget1;
    
    for (let i = 0; i < this.params.iterations; i++) {
      // Horizontal blur
      this.blurMaterial.uniforms.tDiffuse.value = readTarget.texture;
      this.blurMaterial.uniforms.uDirection.value.set(this.params.radius, 0);
      this.renderer.setRenderTarget(writeTarget);
      this.renderer.render(this.scene, this.camera);
      
      // Swap targets
      [readTarget, writeTarget] = [writeTarget, readTarget];
      
      // Vertical blur
      this.blurMaterial.uniforms.tDiffuse.value = readTarget.texture;
      this.blurMaterial.uniforms.uDirection.value.set(0, this.params.radius);
      this.renderer.setRenderTarget(writeTarget);
      this.renderer.render(this.scene, this.camera);
      
      // Swap targets
      [readTarget, writeTarget] = [writeTarget, readTarget];
    }
    
    // Final result is in readTarget
    this.renderTarget = readTarget;
  }

  resize() {
    const width = Math.floor(this.sizes.width * this.bloomResolutionScale);
    const height = Math.floor(this.sizes.height * this.bloomResolutionScale);
    
    this.renderTarget1.setSize(width, height);
    this.renderTarget2.setSize(width, height);
    this.blurMaterial.uniforms.uResolution.value.set(width, height);
  }

  initTweakPane() {
    const folder = 'Bloom';

    this.debug.add(this.params, 'strength', {
      label: 'Strength',
      min: 0,
      max: 5,
      step: 0.01,
    }, folder);

    this.debug.add(this.params, 'radius', {
      label: 'Radius',
      min: 0,
      max: 3,
      step: 0.1,
    }, folder);

    this.debug.add(this.params, 'threshold', {
      label: 'Threshold',
      min: 0,
      max: 1,
      step: 0.01,
    }, folder);
    
    this.debug.add(this.params, 'smoothing', {
      label: 'Smoothing',
      min: 0,
      max: 0.5,
      step: 0.01,
    }, folder);
    
    this.debug.add(this.params, 'iterations', {
      label: 'Iterations',
      min: 1,
      max: 4,
      step: 1,
    }, folder);
    
    // Performance monitoring
    const totalPasses = 1 + (this.params.iterations * 2); // threshold + (h+v blur) * iterations
    this.debug.add({ passes: totalPasses }, 'passes', {
      label: 'Bloom Passes',
      readonly: true,
    }, folder);
  }

  destroy() {
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.thresholdMaterial.dispose();
    this.blurMaterial.dispose();
    this.quad.geometry.dispose();
  }
}
