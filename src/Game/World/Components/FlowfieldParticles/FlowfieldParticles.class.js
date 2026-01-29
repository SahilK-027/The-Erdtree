import * as THREE from 'three';
import Game from '../../../Game.class';
import { FlowfieldParticleSystem } from './FlowfieldParticleSystem.class';
import { SparkleParticleSystem } from './SparkleParticleSystem.class';

export default class FlowfieldParticles {
  constructor(erdtreeModel) {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.renderer = this.game.renderer.rendererInstance;
    this.erdtreeModel = erdtreeModel;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    this.params = {
      flowfieldEnabled: true,
      sparkleEnabled: true,
      flowfieldInfluence: 0.95,
      flowfieldStrength: 0.35,
      flowfieldFrequency: 0.8,
      flowfieldSize: 6.5,
      sparkleSize: 2.0,
      sparkleCount: 200,
      flowfieldColor1: '#ffd700',
      flowfieldColor2: '#ffed9f',
      flowfieldColor3: '#ffa500',
      sparkleColor: '#fe7508',
    };

    this.init();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  init() {
    // Create particle systems - pass the erdtree model for surface sampling
    this.flowfieldSystem = new FlowfieldParticleSystem(
      null, // vertices not needed anymore
      this.erdtreeModel,
      this.scene,
      this.renderer
    );

    this.sparkleSystem = new SparkleParticleSystem(this.scene, this.erdtreeModel);

    // Apply initial parameter values
    this.applyInitialParams();
  }

  applyInitialParams() {
    if (this.flowfieldSystem) {
      const uniforms = this.flowfieldSystem.getUniforms();
      uniforms.uInfluence.value = this.params.flowfieldInfluence;
      uniforms.uStrength.value = this.params.flowfieldStrength;
      uniforms.uFrequency.value = this.params.flowfieldFrequency;

      const material = this.flowfieldSystem.getMaterial();
      material.uniforms.uSize.value = this.params.flowfieldSize;
      material.uniforms.uColor1.value.set(this.params.flowfieldColor1);
      material.uniforms.uColor2.value.set(this.params.flowfieldColor2);
      material.uniforms.uColor3.value.set(this.params.flowfieldColor3);
    }

    if (this.sparkleSystem) {
      this.sparkleSystem.material.uniforms.uSize.value = this.params.sparkleSize;
      this.sparkleSystem.material.uniforms.uColor.value.set(this.params.sparkleColor);
    }
  }

  update() {
    if (!this.game.time) return;

    const deltaTime = this.game.time.delta;
    const elapsedTime = this.game.time.elapsed;

    if (this.params.flowfieldEnabled && this.flowfieldSystem) {
      this.flowfieldSystem.update(deltaTime, elapsedTime);
    }

    if (this.params.sparkleEnabled && this.sparkleSystem) {
      this.sparkleSystem.update(elapsedTime);
    }
  }

  initTweakPane() {
    const folder = 'Flowfield Particles';

    this.debug.add(
      this.params,
      'flowfieldEnabled',
      {
        label: 'Flowfield Enabled',
        onChange: (v) => {
          if (this.flowfieldSystem?.particleSystem) {
            this.flowfieldSystem.particleSystem.visible = v;
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'sparkleEnabled',
      {
        label: 'Sparkle Enabled',
        onChange: (v) => {
          if (this.sparkleSystem?.sparkles) {
            this.sparkleSystem.sparkles.visible = v;
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'flowfieldInfluence',
      {
        label: 'Influence',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          if (this.flowfieldSystem) {
            this.flowfieldSystem.getUniforms().uInfluence.value = v;
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'flowfieldStrength',
      {
        label: 'Strength',
        min: 0,
        max: 2,
        step: 0.05,
        onChange: (v) => {
          if (this.flowfieldSystem) {
            this.flowfieldSystem.getUniforms().uStrength.value = v;
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'flowfieldFrequency',
      {
        label: 'Frequency',
        min: 0.1,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          if (this.flowfieldSystem) {
            this.flowfieldSystem.getUniforms().uFrequency.value = v;
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'flowfieldSize',
      {
        label: 'Flowfield Size',
        min: 1,
        max: 20,
        step: 0.5,
        onChange: (v) => {
          if (this.flowfieldSystem) {
            this.flowfieldSystem.getMaterial().uniforms.uSize.value = v;
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'sparkleSize',
      {
        label: 'Sparkle Size',
        min: 0.5,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          if (this.sparkleSystem) {
            this.sparkleSystem.material.uniforms.uSize.value = v;
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'flowfieldColor1',
      {
        label: 'Flowfield Color 1',
        onChange: (v) => {
          if (this.flowfieldSystem) {
            this.flowfieldSystem.getMaterial().uniforms.uColor1.value.set(v);
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'flowfieldColor2',
      {
        label: 'Flowfield Color 2',
        onChange: (v) => {
          if (this.flowfieldSystem) {
            this.flowfieldSystem.getMaterial().uniforms.uColor2.value.set(v);
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'flowfieldColor3',
      {
        label: 'Flowfield Color 3',
        onChange: (v) => {
          if (this.flowfieldSystem) {
            this.flowfieldSystem.getMaterial().uniforms.uColor3.value.set(v);
          }
        },
      },
      folder
    );

    this.debug.add(
      this.params,
      'sparkleColor',
      {
        label: 'Sparkle Color',
        onChange: (v) => {
          if (this.sparkleSystem) {
            this.sparkleSystem.material.uniforms.uColor.value.set(v);
          }
        },
      },
      folder
    );

    this.debug.addButton(
      {
        title: 'Regenerate Particles',
        onClick: () => {
          this.regenerateParticles();
        },
      },
      folder
    );
  }

  regenerateParticles() {
    // Destroy existing systems
    this.flowfieldSystem?.destroy();
    this.sparkleSystem?.destroy();

    // Reinitialize
    this.init();
  }

  destroy() {
    this.flowfieldSystem?.destroy();
    this.sparkleSystem?.destroy();
  }
}
