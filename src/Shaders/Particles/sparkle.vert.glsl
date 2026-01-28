uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;

attribute float aRandom;

varying float vAlpha;

void main() {
  vec3 pos = position;
  
  // Multi-layered floating motion for mystical effect
  float floatSpeed = 0.5 + aRandom * 0.5;
  float floatAmount = 0.15 + aRandom * 0.1;
  
  // Primary vertical float
  pos.y += sin(uTime * floatSpeed + aRandom * 10.0) * floatAmount;
  
  // Horizontal drift in figure-8 pattern
  pos.x += cos(uTime * 0.3 + aRandom * 8.0) * 0.08;
  pos.z += sin(uTime * 0.25 + aRandom * 6.0) * 0.08;
  
  // Subtle circular orbit
  float orbitAngle = uTime * 0.2 + aRandom * 6.28;
  float orbitRadius = 0.05;
  pos.x += cos(orbitAngle) * orbitRadius;
  pos.z += sin(orbitAngle) * orbitRadius;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Enhanced twinkling with multiple frequencies
  float twinkle1 = sin(uTime * 5.0 + aRandom * 50.0) * 0.5 + 0.5;
  float twinkle2 = sin(uTime * 3.0 + aRandom * 30.0 + 1.0) * 0.5 + 0.5;
  float twinkle = mix(twinkle1, twinkle2, 0.5);
  twinkle = pow(twinkle, 3.0);

  float size = (uSize + twinkle * 4.0 * uSize) * uPixelRatio;
  size *= (2.0 / -mvPosition.z);

  gl_PointSize = size;
  gl_Position = projectionMatrix * mvPosition;

  vAlpha = twinkle * 0.7;
}
