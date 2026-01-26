uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform vec2 uDirection;
uniform float uStrength;

varying vec2 vUv;

void main() {
  vec2 texelSize = 1.0 / uResolution;
  
  // Optimized 9-tap Gaussian blur
  vec4 color = vec4(0.0);
  
  // Center
  color += texture2D(tDiffuse, vUv) * 0.2270270270;
  
  // First ring
  vec2 offset1 = uDirection * texelSize * 1.3846153846;
  color += texture2D(tDiffuse, vUv + offset1) * 0.3162162162;
  color += texture2D(tDiffuse, vUv - offset1) * 0.3162162162;
  
  // Second ring
  vec2 offset2 = uDirection * texelSize * 3.2307692308;
  color += texture2D(tDiffuse, vUv + offset2) * 0.0702702703;
  color += texture2D(tDiffuse, vUv - offset2) * 0.0702702703;
  
  gl_FragColor = color * uStrength;
}
