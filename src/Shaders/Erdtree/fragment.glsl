uniform vec3 uBaseColor;
uniform vec3 uFresnelColor;
uniform float uFresnelPower;
uniform float uFresnelIntensity;
uniform float uTrunkFadeStart;
uniform float uTrunkFadeEnd;
uniform float uTrunkOpacity;
uniform float uGlowIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vWorldPosition;
varying float vHeight;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  // Fresnel effect for rim lighting
  float fresnel = pow(1.0 - abs(dot(normal, viewDir)), uFresnelPower);
  
  // Calculate distance from center (trunk axis)
  float distanceFromCenter = length(vWorldPosition.xy);
  
  // Elliptical fade: edges stay visible longer
  // The fade threshold increases with distance from center
  float ellipticalOffset = distanceFromCenter * 0.3;
  float adjustedHeight = vHeight - ellipticalOffset;
  
  // Vertical fade for trunk with elliptical shape
  float heightFade = smoothstep(uTrunkFadeStart, uTrunkFadeEnd, adjustedHeight);
  
  // More aggressive fade - discard lower parts completely
  if (adjustedHeight < uTrunkFadeStart) {
    discard;
  }
  
  // Base color with fresnel
  vec3 color = mix(uBaseColor, uFresnelColor, fresnel * uFresnelIntensity);
  
  // Add glow on edges
  color += uFresnelColor * fresnel * uGlowIntensity;
  
  // Calculate final opacity
  float alpha = mix(uTrunkOpacity * 0.1, 1.0, heightFade);
  float edgeVisibility = pow(fresnel, 0.5);
  alpha *= (0.5 + edgeVisibility * 0.95);

  alpha *= (1.0 + fresnel * 0.7);
    if (alpha < 0.02) {
    discard;
  }
  
  gl_FragColor = vec4(color, alpha);
}