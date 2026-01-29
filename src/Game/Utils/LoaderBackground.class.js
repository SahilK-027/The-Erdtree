import * as THREE from 'three';
import vertexShader from '../../Shaders/Loader/vertex.glsl';
import fragmentShader from '../../Shaders/Loader/fragment.glsl';

export default class LoaderBackground {
  constructor(canvasId = 'loader-bg') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`Canvas with id "${canvasId}" not found`);
      return;
    }

    this.isRunning = false;
    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      alpha: true 
    });

    // Shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      vertexShader,
      fragmentShader,
    });

    // Mesh
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    // Handle resize
    this.handleResize = this.resize.bind(this);
    window.addEventListener('resize', this.handleResize);

    this.resize();
    this.start();
  }

  resize() {
    if (!this.renderer || !this.material) return;
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.material.uniforms.uResolution.value.set(
      window.innerWidth,
      window.innerHeight
    );
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  animate() {
    if (!this.isRunning) return;

    this.material.uniforms.uTime.value += 0.016;
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(() => this.animate());
  }

  dispose() {
    this.isRunning = false;
    
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
