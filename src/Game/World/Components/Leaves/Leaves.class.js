import * as THREE from 'three';
import vertexShader from '../../../../Shaders/Leaves/vertex.glsl';
import fragmentShader from '../../../../Shaders/Leaves/fragment.glsl';

export default class LeavesMaterial {
  constructor(debug = null, isDebugEnabled = false) {
    this.debug = debug;
    this.isDebugEnabled = isDebugEnabled;

    this.params = {
      baseColor: '#eed258', // Rich golden
      tipColor: '#f4d56f', // Bright golden yellow
      backlitColor: '#dbcaa9', // Very bright warm yellow for translucency
      shadowColor: '#e5e0d1', // Darker warm brown for shadows
      emissiveStrength: 0.25, // Luminous quality
      translucency: 0.1, // Subsurface scattering strength
      colorVariation: 0.8, // Per-leaf color randomness
      glowIntensity: 0.2, // Edge glow
      fresnelPower: 1.2, // Edge detection sensitivity
      subsurfaceDistortion: 0.85, // How much light scatters
      subsurfacePower: 3.0, // Sharpness of subsurface effect
      subsurfaceScale: 1.0, // Overall subsurface intensity
      ambientStrength: 0.4, // Minimum lighting
      wrapLighting: 0.5, // Softer lighting falloff
      lightDirectionX: 0.5,
      lightDirectionY: 1.0,
      lightDirectionZ: 0.3,
      // Wind animation parameters
      windStrength: 0.2,
      windSpeed: 1.5,
      windDirectionX: 1.0,
      windDirectionZ: 0.5,
      gustStrength: 0.3,
      gustFrequency: 0.6,
      swayVariation: 1.5,
    };

    this.material = this.createMaterial();

    if (this.isDebugEnabled && this.debug) {
      this.initTweakPane();
    }
  }

  createMaterial() {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLightDirection: {
          value: new THREE.Vector3(
            this.params.lightDirectionX,
            this.params.lightDirectionY,
            this.params.lightDirectionZ,
          ).normalize(),
        },
        uBaseColor: { value: new THREE.Color(this.params.baseColor) },
        uTipColor: { value: new THREE.Color(this.params.tipColor) },
        uBacklitColor: { value: new THREE.Color(this.params.backlitColor) },
        uShadowColor: { value: new THREE.Color(this.params.shadowColor) },
        uEmissiveStrength: { value: this.params.emissiveStrength },
        uTranslucency: { value: this.params.translucency },
        uColorVariation: { value: this.params.colorVariation },
        uGlowIntensity: { value: this.params.glowIntensity },
        uFresnelPower: { value: this.params.fresnelPower },
        uSubsurfaceDistortion: { value: this.params.subsurfaceDistortion },
        uSubsurfacePower: { value: this.params.subsurfacePower },
        uSubsurfaceScale: { value: this.params.subsurfaceScale },
        uAmbientStrength: { value: this.params.ambientStrength },
        uWrapLighting: { value: this.params.wrapLighting },
        // Wind uniforms
        uWindStrength: { value: this.params.windStrength },
        uWindSpeed: { value: this.params.windSpeed },
        uWindDirection: { value: new THREE.Vector2(this.params.windDirectionX, this.params.windDirectionZ) },
        uGustStrength: { value: this.params.gustStrength },
        uGustFrequency: { value: this.params.gustFrequency },
        uSwayVariation: { value: this.params.swayVariation },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: true,
    });

    return material;
  }

  updateLightDirection() {
    this.material.uniforms.uLightDirection.value
      .set(
        this.params.lightDirectionX,
        this.params.lightDirectionY,
        this.params.lightDirectionZ,
      )
      .normalize();
  }

  update(time) {
    this.material.uniforms.uTime.value = time;
    // Debug: uncomment to verify updates
    // if (Math.floor(time) % 5 === 0 && Math.floor(time * 10) % 10 === 0) {
    //   console.log('Leaves time:', time);
    // }
  }

  initTweakPane() {
    const folder = 'Leaves Material';

    this.debug.add(
      this.params,
      'baseColor',
      {
        label: 'Base Color',
        onChange: (v) => {
          this.material.uniforms.uBaseColor.value.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'tipColor',
      {
        label: 'Tip Color',
        onChange: (v) => {
          this.material.uniforms.uTipColor.value.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'backlitColor',
      {
        label: 'Backlit Color',
        onChange: (v) => {
          this.material.uniforms.uBacklitColor.value.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'shadowColor',
      {
        label: 'Shadow Color',
        onChange: (v) => {
          this.material.uniforms.uShadowColor.value.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'emissiveStrength',
      {
        label: 'Emissive Strength',
        min: 0,
        max: 2,
        step: 0.05,
        onChange: (v) => {
          this.material.uniforms.uEmissiveStrength.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'translucency',
      {
        label: 'Translucency',
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          this.material.uniforms.uTranslucency.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'colorVariation',
      {
        label: 'Color Variation',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          this.material.uniforms.uColorVariation.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'glowIntensity',
      {
        label: 'Glow Intensity',
        min: 0,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          this.material.uniforms.uGlowIntensity.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'fresnelPower',
      {
        label: 'Fresnel Power',
        min: 0.5,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          this.material.uniforms.uFresnelPower.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'subsurfaceDistortion',
      {
        label: 'Subsurface Distortion',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          this.material.uniforms.uSubsurfaceDistortion.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'subsurfacePower',
      {
        label: 'Subsurface Power',
        min: 1,
        max: 10,
        step: 0.5,
        onChange: (v) => {
          this.material.uniforms.uSubsurfacePower.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'subsurfaceScale',
      {
        label: 'Subsurface Scale',
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          this.material.uniforms.uSubsurfaceScale.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'ambientStrength',
      {
        label: 'Ambient Strength',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          this.material.uniforms.uAmbientStrength.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'wrapLighting',
      {
        label: 'Wrap Lighting',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          this.material.uniforms.uWrapLighting.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'lightDirectionX',
      {
        label: 'Light Dir X',
        min: -1,
        max: 1,
        step: 0.1,
        onChange: () => {
          this.updateLightDirection();
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'lightDirectionY',
      {
        label: 'Light Dir Y',
        min: -1,
        max: 1,
        step: 0.1,
        onChange: () => {
          this.updateLightDirection();
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'lightDirectionZ',
      {
        label: 'Light Dir Z',
        min: -1,
        max: 1,
        step: 0.1,
        onChange: () => {
          this.updateLightDirection();
        },
      },
      folder,
    );

    // Wind controls
    this.debug.add(
      this.params,
      'windStrength',
      {
        label: 'Wind Strength',
        min: 0,
        max: 2,
        step: 0.05,
        onChange: (v) => {
          this.material.uniforms.uWindStrength.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'windSpeed',
      {
        label: 'Wind Speed',
        min: 0,
        max: 3,
        step: 0.1,
        onChange: (v) => {
          this.material.uniforms.uWindSpeed.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'gustStrength',
      {
        label: 'Gust Strength',
        min: 0,
        max: 1,
        step: 0.05,
        onChange: (v) => {
          this.material.uniforms.uGustStrength.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'gustFrequency',
      {
        label: 'Gust Frequency',
        min: 0,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          this.material.uniforms.uGustFrequency.value = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'swayVariation',
      {
        label: 'Sway Variation',
        min: 0,
        max: 2,
        step: 0.1,
        onChange: (v) => {
          this.material.uniforms.uSwayVariation.value = v;
        },
      },
      folder,
    );
  }

  dispose() {
    this.material?.dispose();
  }
}
