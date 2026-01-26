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
  
  // Vertical fade for trunk (bottom half fades out)
  float heightFade = smoothstep(uTrunkFadeStart, uTrunkFadeEnd, vHeight);
  
  // Base color with fresnel
  vec3 color = mix(uBaseColor, uFresnelColor, fresnel * uFresnelIntensity);
  
  // Add glow on edges
  color += uFresnelColor * fresnel * uGlowIntensity;
  
  // Calculate final opacity
  float alpha = mix(uTrunkOpacity, 1.0, heightFade);
  alpha *= (0.3 + fresnel * 0.7); // More transparent in center, opaque on edges
  
  gl_FragColor = vec4(color, alpha);
}