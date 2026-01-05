varying vec2 vUv;

uniform sampler2D uMap;
uniform float uTime;
uniform vec2 uMeshCenter;
uniform vec3 uColorMultiplier;

const float PI = 3.1415926535897932384626433832795;
const float PHI = 1.61803398874989484820459; // Φ = Golden Ratio

float random(in vec2 xy, in float seed) {
  return fract(tan(distance(xy * PHI, xy) * seed) * xy.x);
}

float random2(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float interleavedGradientNoise(vec2 coord) {
  vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(coord, magic.xy)));
}

void main() {
  vec4 textureColor = texture2D(uMap, vUv);

  vec2 toCenter = uMeshCenter - vUv;

  textureColor += texture2D(uMap, vUv + toCenter * 0.01);

  vec4 color = vec4(0.0);
  float total = 0.0;
  float samples = 48.0;

  for(float i = 0.0; i < samples; i++) {
    float lerp = (i + interleavedGradientNoise(vec2(gl_FragCoord.xy))) / samples;
    float weight = sin(lerp * PI);
    vec4 mySample = texture2D(uMap, vUv + toCenter * lerp * 1.0);
    mySample.rgb *= mySample.a;
    color += mySample * weight;
    total += weight;
  }

  color.rgb /= 1.25;

  gl_FragColor = color * vec4(uColorMultiplier, 1.0);
}
