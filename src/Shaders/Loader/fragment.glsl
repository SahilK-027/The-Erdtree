//Shader License: CC BY 3.0
//Author: Jan Mróz (jaszunio15)
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

#define PI 3.1415927
#define TWO_PI 6.283185
#define ANIMATION_SPEED 1.5
#define MOVEMENT_SPEED 1.0
#define MOVEMENT_DIRECTION vec2(0.7, -1.0)
#define PARTICLE_SIZE 0.0035
#define PARTICLE_SCALE (vec2(0.5, 1.6))
#define PARTICLE_SCALE_VAR (vec2(0.25, 0.2))
#define PARTICLE_BLOOM_SCALE (vec2(0.5, 0.8))
#define PARTICLE_BLOOM_SCALE_VAR (vec2(0.3, 0.1))
#define SPARK_COLOR vec3(1.0, 0.4, 0.05) * 1.5
#define BLOOM_COLOR vec3(1.0, 0.4, 0.05) * 0.8
#define SMOKE_COLOR vec3(1.0, 0.43, 0.1) * 0.8
#define SIZE_MOD 1.05
#define ALPHA_MOD 0.9
#define LAYERS_COUNT 10

float hash1_2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 hash2_2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453123);
}

float noise1_2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash1_2(i);
  float b = hash1_2(i + vec2(1.0, 0.0));
  float c = hash1_2(i + vec2(0.0, 1.0));
  float d = hash1_2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec2 noise2_2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash1_2(i);
  float b = hash1_2(i + vec2(1.0, 0.0));
  float c = hash1_2(i + vec2(0.0, 1.0));
  float d = hash1_2(i + vec2(1.0, 1.0));
  return vec2(
    mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
    mix(mix(a, c, f.y), mix(b, d, f.y), f.x)
  );
}

float layeredNoise1_2(vec2 uv, float sizeMod, float alphaMod, int layers, float animation) {
  float noise = 0.0;
  float alpha = 1.0;
  float size = 1.0;
  vec2 offset = vec2(0.0);
  
  for (int i = 0; i < 10; i++) {
    if (i >= layers) break;
    offset += hash2_2(vec2(alpha, size)) * 10.0;
    noise += noise1_2(uv * size + uTime * animation * 8.0 * MOVEMENT_DIRECTION * MOVEMENT_SPEED + offset) * alpha;
    alpha *= alphaMod;
    size *= sizeMod;
  }
  
  noise *= (1.0 - alphaMod) / (1.0 - pow(alphaMod, float(layers)));
  return noise;
}

vec2 rotate(vec2 point, float deg) {
  float s = sin(deg);
  float c = cos(deg);
  return mat2(s, c, -c, s) * point;
}

vec2 voronoiPointFromRoot(vec2 root, float deg) {
  vec2 point = hash2_2(root) - 0.5;
  float s = sin(deg);
  float c = cos(deg);
  point = mat2(s, c, -c, s) * point * 0.66;
  point += root + 0.5;
  return point;
}

vec2 randomAround2_2(vec2 point, vec2 range, vec2 uv) {
  return point + (hash2_2(uv) - 0.5) * range;
}

vec3 fireParticles(vec2 uv, vec2 originalUV) {
  vec3 particles = vec3(0.0);
  vec2 rootUV = floor(uv);
  float deg = uTime * ANIMATION_SPEED * (hash1_2(rootUV) - 0.5) * 2.0;
  vec2 pointUV = voronoiPointFromRoot(rootUV, deg);
  
  vec2 tempUV = uv + (noise2_2(uv * 2.0) - 0.5) * 0.1;
  tempUV += -(noise2_2(uv * 3.0 + uTime) - 0.5) * 0.07;
  
  float dist = length(rotate(tempUV - pointUV, 0.7) * randomAround2_2(PARTICLE_SCALE, PARTICLE_SCALE_VAR, rootUV));
  float distBloom = length(rotate(tempUV - pointUV, 0.7) * randomAround2_2(PARTICLE_BLOOM_SCALE, PARTICLE_BLOOM_SCALE_VAR, rootUV));
  
  particles += (1.0 - smoothstep(PARTICLE_SIZE * 0.6, PARTICLE_SIZE * 3.0, dist)) * SPARK_COLOR;
  particles += pow((1.0 - smoothstep(0.0, PARTICLE_SIZE * 6.0, distBloom)) * 1.0, 3.0) * BLOOM_COLOR;
  
  float border = (hash1_2(rootUV) - 0.5) * 2.0;
  float disappear = 1.0 - smoothstep(border, border + 0.5, originalUV.y);
  border = (hash1_2(rootUV + 0.214) - 1.8) * 0.7;
  float appear = smoothstep(border, border + 0.4, originalUV.y);
  
  return particles * disappear * appear;
}

vec3 layeredParticles(vec2 uv, float sizeMod, float alphaMod, int layers, float smoke) {
  vec3 particles = vec3(0);
  float size = 1.0;
  float alpha = 1.0;
  vec2 offset = vec2(0.0);
  
  for (int i = 0; i < 10; i++) {
    if (i >= layers) break;
    vec2 noiseOffset = (noise2_2(uv * size * 2.0 + 0.5) - 0.5) * 0.15;
    vec2 bokehUV = (uv * size + uTime * MOVEMENT_DIRECTION * MOVEMENT_SPEED) + offset + noiseOffset;
    particles += fireParticles(bokehUV, uv) * alpha * (1.0 - smoothstep(0.0, 1.0, smoke) * (float(i) / float(layers)));
    offset += hash2_2(vec2(alpha, alpha)) * 10.0;
    alpha *= alphaMod;
    size *= sizeMod;
  }
  
  return particles;
}

vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289_4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289_4(((x*34.0)+1.0)*x); }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289_3(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = inversesqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float prng(vec2 seed) {
  seed = fract(seed * vec2(5.3983, 5.4427));
  seed += dot(seed.yx, seed.xy + vec2(21.5351, 14.3137));
  return fract(seed.x * seed.y * 95.4337);
}

float noiseStack_base(vec3 pos, int octaves, float falloff) {
  float noise = snoise(pos);
  float off = 1.0;
  if (octaves > 1) { pos *= 2.0; off *= falloff; noise = (1.0 - off) * noise + off * snoise(pos); }
  if (octaves > 2) { pos *= 2.0; off *= falloff; noise = (1.0 - off) * noise + off * snoise(pos); }
  if (octaves > 3) { pos *= 2.0; off *= falloff; noise = (1.0 - off) * noise + off * snoise(pos); }
  return (1.0 + noise) / 2.0;
}

vec2 noiseStackUV_base(vec3 pos, int octaves, float falloff) {
  return vec2(
    noiseStack_base(pos, octaves, falloff),
    noiseStack_base(pos + vec3(3984.293, 423.21, 5235.19), octaves, falloff)
  );
}

vec3 getBaseSparks(vec2 fragCoord, vec2 resolution) {
  float xpart = fragCoord.x / resolution.x;
  float ypart = fragCoord.y / resolution.y;
  float ypartClip = fragCoord.y / 210.0;
  float ypartClipped = min(ypartClip, 1.0);
  float ypartClippedn = 1.0 - ypartClipped;
  float xfuel = 1.0 - abs(2.0 * xpart - 1.0);
  
  float realTime = 0.5 * uTime;
  vec3 flow = vec3(
    4.1 * (0.5 - xpart) * pow(ypartClippedn, 4.0),
    -2.0 * xfuel * pow(ypartClippedn, 64.0),
    0.0
  );
  
  // Spark generation
  float sparkGridSize = 30.0;
  float sparkSpeed = 500.0;
  
  vec2 sparkCoord = fragCoord - vec2(0.0, sparkSpeed * realTime);
  sparkCoord -= 30.0 * noiseStackUV_base(0.01 * vec3(sparkCoord, 30.0 * uTime), 1, 0.4);
  sparkCoord += 100.0 * flow.xy;
  
  if (mod(sparkCoord.y / sparkGridSize, 2.0) < 1.0) {
    sparkCoord.x += 0.5 * sparkGridSize;
  }
  
  vec2 sparkGridIndex = floor(sparkCoord / sparkGridSize);
  float sparkRandom = prng(sparkGridIndex);
  float sparkLife = min(10.0 * (1.0 - min((sparkGridIndex.y + (sparkSpeed * realTime / sparkGridSize)) / (24.0 - 20.0 * sparkRandom), 1.0)), 1.0);
  
  vec3 sparks = vec3(0.0);
  if (sparkLife > 0.0) {
    float sparkSize = xfuel * xfuel * sparkRandom * 0.08;
    float sparkRadians = 999.0 * sparkRandom * TWO_PI + 2.0 * uTime;
    vec2 sparkCircular = vec2(sin(sparkRadians), cos(sparkRadians));
    vec2 sparkOffset = (0.5 - sparkSize) * sparkGridSize * sparkCircular;
    vec2 sparkModulus = mod(sparkCoord + sparkOffset, sparkGridSize) - 0.5 * sparkGridSize;
    float sparkLength = length(sparkModulus);
    float sparksGray = max(0.0, 1.0 - sparkLength / (sparkSize * sparkGridSize));
    sparks = sparkLife * sparksGray * vec3(1.0, 0.3, 0.0);
  }
  
  return sparks;
}

void main() {
  vec2 fragCoord = vUv * uResolution;
  vec3 baseFire = getBaseSparks(fragCoord, uResolution) * 0.7;
  
  vec2 uv = (2.0 * vUv * uResolution - uResolution.xy) / uResolution.x;
  float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv + vec2(0.0, 0.3)));
  uv *= 1.8;
  
  float smokeIntensity = layeredNoise1_2(uv * 10.0 + uTime * 4.0 * MOVEMENT_DIRECTION * MOVEMENT_SPEED, 1.7, 0.7, 6, 0.2);
  smokeIntensity *= pow(1.0 - smoothstep(-1.0, 1.6, uv.y), 2.0);
  
  vec3 smoke = smokeIntensity * SMOKE_COLOR * 0.8 * vignette;
  smoke *= pow(layeredNoise1_2(uv * 4.0 + uTime * 0.5 * MOVEMENT_DIRECTION * MOVEMENT_SPEED, 1.8, 0.5, 3, 0.2), 2.0) * 1.75;
  
  vec3 particles = layeredParticles(uv, SIZE_MOD, ALPHA_MOD, LAYERS_COUNT, smokeIntensity);
  vec3 amberEffect = particles + smoke + SMOKE_COLOR * 0.02;
  amberEffect *= vignette;
  amberEffect = smoothstep(-0.08, 1.0, amberEffect);
  
  vec3 col = baseFire + amberEffect * 0.9;
  gl_FragColor = vec4(col, 1.0);
}
