varying vec2 vUv;

uniform sampler2D bloomTexture;
uniform sampler2D glowTexture;
uniform float uTime;
uniform vec2 uMeshCenter;
uniform vec3 uColorMultiplier;
uniform bool bloomEnabled;
uniform bool glowEnabled;

const float PI = 3.1415926535897932384626433832795;

float interleavedGradientNoise(vec2 coord) {
  vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(coord, magic.xy)));
}

// Glow effect function (reused from fragmentPost.glsl logic)
vec4 computeGlow(sampler2D map, vec2 uv, vec2 meshCenter, vec3 colorMultiplier, float samples) {
  vec2 toCenter = meshCenter - uv;
  vec4 glowColor = vec4(0.0);

  for(float i = 0.0; i < samples; i++) {
    float lerp = (i + interleavedGradientNoise(vec2(gl_FragCoord.xy))) / samples;
    float weight = sin(lerp * PI);
    vec4 mySample = texture2D(map, uv + toCenter * lerp * 1.0);
    mySample.rgb *= mySample.a;
    glowColor += mySample * weight;
  }

  glowColor.rgb /= 1.25;
  return glowColor * vec4(colorMultiplier, 1.0);
}

void main() {
  vec4 finalColor = vec4(0.0);

  // Add bloom if enabled
  if(bloomEnabled) {
    vec4 bloom = texture2D(bloomTexture, vUv);
    finalColor += bloom;
  }

  // Add glow if enabled (using same logic as fragmentPost.glsl)
  if(glowEnabled) {
    finalColor += computeGlow(glowTexture, vUv, uMeshCenter, uColorMultiplier, 32.0);
  }

  gl_FragColor = finalColor;
}
