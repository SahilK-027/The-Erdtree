varying vec2 vUv;

uniform sampler2D uMap;
uniform float uTile;      // e.g. 10.0
uniform float uCutoff;    // center of transition (0..1)
uniform float uFeather;   // half-width of soft edge, e.g. 0.02

// Hash function for pseudo-random per-tile values
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  return vec2(hash21(p), hash21(p + 17.1));
}

void main() {
  vec2 scaledUv = vUv * uTile;
  vec2 tileId = floor(scaledUv);      // which tile we're in
  vec2 tileUv = fract(scaledUv);      // position within tile [0,1]

  // Random offset per tile
  vec2 randomOffset = hash22(tileId) * 0.5;
  
  // Random rotation (0, 90, 180, or 270 degrees)
  float rotIndex = floor(hash21(tileId + 7.3) * 4.0);
  vec2 rotatedUv = tileUv;
  if (rotIndex == 1.0) rotatedUv = vec2(1.0 - tileUv.y, tileUv.x);
  else if (rotIndex == 2.0) rotatedUv = vec2(1.0 - tileUv.x, 1.0 - tileUv.y);
  else if (rotIndex == 3.0) rotatedUv = vec2(tileUv.y, 1.0 - tileUv.x);

  // Random flip
  if (hash21(tileId + 3.7) > 0.5) rotatedUv.x = 1.0 - rotatedUv.x;
  if (hash21(tileId + 5.1) > 0.5) rotatedUv.y = 1.0 - rotatedUv.y;

  vec4 textureColor = texture2D(uMap, fract(rotatedUv + randomOffset));
  vec3 texCol = vec3(1.0 - textureColor.r);

  // smoothstep(edge0, edge1, x) -> 0->1 smoothly
  float t = smoothstep(uCutoff - uFeather, uCutoff + uFeather, vUv.y);

  // bottom (t≈0) shows texture; top (t≈1) shows base color (black here)
  vec3 outCol = mix(texCol, vec3(0.0), t);

  gl_FragColor = vec4(outCol, 1.0);
}
