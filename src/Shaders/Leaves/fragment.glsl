uniform vec3 uLightDirection;
uniform vec3 uBaseColor;
uniform vec3 uTipColor;
uniform vec3 uBacklitColor;
uniform vec3 uShadowColor;
uniform vec3 uDivineColor;
uniform float uEmissiveStrength;
uniform float uTranslucency;
uniform float uColorVariation;
uniform float uGlowIntensity;
uniform float uFresnelPower;
uniform float uSubsurfaceDistortion;
uniform float uSubsurfacePower;
uniform float uSubsurfaceScale;
uniform float uAmbientStrength;
uniform float uWrapLighting;
uniform float uTime;
uniform float uSparkleIntensity;
uniform float uSparkleScale;
uniform float uDivineGlow;
uniform float uRadiance;
uniform float uPulseSpeed;
uniform float uPulseAmount;
uniform float uAtmosphericGlow;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vRandomness;
varying float vInstanceId;

// Improved noise functions
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float hash3D(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal noise for more natural variation
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 2; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Sparkle/shimmer effect
float sparkle(vec3 worldPos, float time, float randomOffset) {
    vec3 sparklePos = worldPos * uSparkleScale + vec3(time * 0.5 + randomOffset * 100.0);
    float sparkleNoise = hash3D(floor(sparklePos));
    
    // Create twinkling effect
    float twinkle = sin(time * 3.0 + randomOffset * 6.28318) * 0.5 + 0.5;
    twinkle = pow(twinkle, 8.0);
    
    // Only some positions sparkle
    float sparkleThreshold = 0.95;
    float sparkle = step(sparkleThreshold, sparkleNoise) * twinkle;
    
    return sparkle;
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightDirection);
    
    // === Pulsing effect ===
    float pulse = sin(uTime * uPulseSpeed + vRandomness * 6.28318) * 0.5 + 0.5;
    pulse = mix(1.0, 1.0 + uPulseAmount, pulse);
    
    // === Enhanced Color Variation (VIEW-INDEPENDENT) ===
    // Multi-octave noise for natural variation
    float colorNoise1 = fbm(vec2(vRandomness * 10.0, vRandomness * 5.0));
    float colorNoise2 = noise(vUv * 3.0 + vRandomness);
    float combinedNoise = mix(colorNoise1, colorNoise2, 0.5);
    
    // Per-leaf color variation (view-independent)
    vec3 leafBaseColor = mix(uBaseColor, uTipColor, combinedNoise * uColorVariation);
    
    // Gradient from base to tip with vein patterns (view-independent)
    float tipGradient = smoothstep(0.2, 0.9, vUv.y);
    float veinPattern = abs(sin(vUv.x * 20.0 + vRandomness * 10.0)) * 0.08;
    vec3 leafColor = mix(leafBaseColor, uTipColor, tipGradient * 0.5 - veinPattern);
    
    // Divine highlights only at tips (view-independent)
    float divineAmount = pow(colorNoise1, 2.0) * uDivineGlow;
    leafColor = mix(leafColor, uDivineColor, tipGradient * divineAmount * 0.3);
    
    // === Sparkle Effect ===
    float sparkleEffect = sparkle(vWorldPosition, uTime, vRandomness);
    sparkleEffect *= smoothstep(0.3, 0.7, vUv.y); // More sparkles at tips
    
    // === Improved Lighting ===
    // Wrap lighting for softer, more organic look
    float NdotL = dot(normal, lightDir);
    float wrappedDiffuse = (NdotL + uWrapLighting) / (1.0 + uWrapLighting);
    wrappedDiffuse = max(0.0, wrappedDiffuse);
    
    // Softer diffuse with ambient
    float diffuse = mix(uAmbientStrength, 1.0, wrappedDiffuse);
    
    // === Simple Back Lighting (view-independent) ===
    // Add glow when light comes from behind the leaf
    float backLight = max(0.0, -NdotL);
    vec3 backLitGlow = mix(uBacklitColor, uDivineColor, uDivineGlow * 0.5) * backLight * uTranslucency * 0.5;
    
    // === Ambient Occlusion Approximation ===
    // Leaves deeper in canopy (lower Y) are darker
    float heightFactor = smoothstep(-1.0, 2.5, vWorldPosition.y);
    float ao = mix(0.5, 1.0, heightFactor);
    
    // Add noise-based occlusion for depth
    float occlusionNoise = fbm(vWorldPosition.xz * 2.0);
    ao *= mix(0.75, 1.0, occlusionNoise);
    
    // === Radiance (inner glow) ===
    // Leaves glow from within, stronger when lit
    float radiance = mix(uRadiance * 0.5, uRadiance, diffuse);
    radiance *= pulse; // Pulsing radiance
    
    // === Combine Lighting (All view-independent) ===
    // Base lighting with AO
    vec3 diffuseColor = leafColor * diffuse * ao;
    
    // Start with diffuse color
    vec3 litColor = diffuseColor;
    
    // === Emissive for luminous quality ===
    vec3 emissive = leafColor * uEmissiveStrength * (0.8 + colorNoise1 * 0.4);
    emissive *= pulse; // Pulsing emissive
    litColor += emissive;
    
    // === Inner radiance ===
    vec3 innerGlow = leafColor * radiance * (0.7 + divineAmount * 0.3);
    litColor += innerGlow;
    
    // === Back lighting (view-independent) ===
    litColor += backLitGlow;
    
    // === Sparkles ===
    litColor += uDivineColor * sparkleEffect * uSparkleIntensity * 2.0;
    
    // === Shadow color for depth ===
    // Darker leaves in shadow get warmer, more saturated color
    float shadowAmount = 1.0 - diffuse;
    litColor = mix(litColor, uShadowColor * leafColor, shadowAmount * 0.2 * (1.0 - ao));
    
    // === Final adjustments ===
    // Enhance contrast and saturation
    float luminance = dot(litColor, vec3(0.299, 0.587, 0.114));
    
    // S-curve for contrast with divine boost
    float contrast = smoothstep(0.2, 0.8, luminance);
    litColor = mix(litColor * 0.6, litColor * 1.5, contrast);
    
    // Saturation boost for magical feel (moderate to preserve color consistency)
    vec3 luminanceVec = vec3(luminance);
    litColor = mix(luminanceVec, litColor, 1.25);
    
    // Slight color grading - push toward divine warm tones
    litColor = mix(litColor, litColor * vec3(1.08, 1.03, 0.97), 0.3);
    
    // Brighten overall for divine look
    litColor *= 1.15;
    
    // === Alpha ===
    float alpha = 1.0;
    
    gl_FragColor = vec4(litColor, alpha);
}
