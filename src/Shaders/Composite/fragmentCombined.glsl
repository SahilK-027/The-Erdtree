varying vec2 vUv;

uniform sampler2D bloomTexture;
uniform sampler2D glowTexture;
uniform float uTime;
uniform vec2 uMeshCenter;
uniform vec3 uColorMultiplier;
uniform bool bloomEnabled;
uniform bool glowEnabled;
uniform float glowSamples;

const float PI = 3.1415926535897932384626433832795;
const float INV_1_25 = 0.8;

float interleavedGradientNoise(vec2 coord) {
  vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(coord, magic.xy)));
}

vec4 computeGlow(sampler2D map, vec2 uv, vec2 meshCenter, vec3 colorMultiplier) {
  vec2 toCenter = meshCenter - uv;
  float distToCenter = length(toCenter);
  
  // Early exit if too far from center
  if(distToCenter > 1.5) {
    return vec4(0.0);
  }
  
  vec4 glowColor = vec4(0.0);
  float invSamples = 1.0 / glowSamples;
  float noise = interleavedGradientNoise(gl_FragCoord.xy);

  for(float i = 0.0; i < 64.0; i++) {
    if(i >= glowSamples) break;
    
    float lerp = (i + noise) * invSamples;
    float weight = sin(lerp * PI);
    vec4 mySample = texture2D(map, uv + toCenter * lerp);
    mySample.rgb *= mySample.a;
    glowColor += mySample * weight;
  }

  glowColor.rgb *= INV_1_25;
  return glowColor * vec4(colorMultiplier, 1.0);
}

void main() {
  vec4 finalColor = vec4(0.0);

  // Add bloom if enabled
  if(bloomEnabled) {
    finalColor += texture2D(bloomTexture, vUv);
  }

  // Add glow if enabled
  if(glowEnabled) {
    finalColor += computeGlow(glowTexture, vUv, uMeshCenter, uColorMultiplier);
  }

  gl_FragColor = finalColor;
}
