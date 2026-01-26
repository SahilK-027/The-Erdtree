uniform sampler2D tDiffuse;
uniform float uThreshold;
uniform float uSmoothing;

varying vec2 vUv;

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);
  float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
  
  // Smooth threshold to avoid hard cutoff
  float contribution = smoothstep(uThreshold - uSmoothing, uThreshold + uSmoothing, luminance);
  
  gl_FragColor = texel * contribution;
}
