varying vec2 vUv;

uniform sampler2D uMap;
uniform float uTime;
uniform vec2 uMeshCenter;
uniform vec3 uColorMultiplier;

const float PI = 3.1415926535897932384626433832795;

float interleavedGradientNoise(vec2 coord) {
  vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(coord, magic.xy)));
}

void main() {
  vec2 toCenter = uMeshCenter - vUv;

  vec4 color = vec4(0.0);
  float total = 0.0;
  float samples = 64.0;

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
