uniform float uTime;
uniform float uWindStrength;
uniform float uWindSpeed;
uniform vec2 uWindDirection;
uniform float uGustStrength;
uniform float uGustFrequency;
uniform float uSwayVariation;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vRandomness;

attribute float instanceRandomness;

// Noise function for wind variation
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float n = i.x + i.y * 57.0 + i.z * 113.0;
    return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
        f.z
    );
}

// Rotation matrix around arbitrary axis
mat3 rotateAxis(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
}

void main() {
    // Use instance ID to generate per-leaf randomness
    float instanceId = float(gl_InstanceID);
    vRandomness = fract(sin(instanceId * 12.9898) * 43758.5453);
    
    // Multiple random values for different aspects
    float randomPhase = fract(sin(instanceId * 78.233) * 43758.5453);
    float randomSpeed = fract(sin(instanceId * 45.164) * 43758.5453);
    float randomIntensity = fract(sin(instanceId * 91.782) * 43758.5453);
    
    vUv = uv;
    
    // === Wind Animation ===
    // Each leaf has unique timing
    float leafSpeed = 0.6 + randomSpeed * 0.8; // 0.6 to 1.4x speed
    float windTime = uTime * uWindSpeed * leafSpeed;
    float leafPhase = randomPhase * 6.28318; // Random starting phase
    
    // Get world position for spatial wind variation
    vec4 worldPos = modelMatrix * instanceMatrix * vec4(position, 1.0);
    
    // Base wind wave with spatial variation
    float spatialWind = noise(vec3(worldPos.xz * 0.3, windTime * 0.5 + leafPhase));
    
    // Fast flutter (leaf rotation/twist) - each leaf flutters at different rate
    float flutterSpeed = windTime * (2.5 + randomSpeed * 1.5) + leafPhase;
    float flutter = sin(flutterSpeed) * cos(flutterSpeed * (1.5 + randomIntensity * 0.5));
    flutter += noise(vec3(worldPos.xz * 0.5 + randomPhase * 10.0, windTime * 2.0)) * 0.5;
    
    // Gust effect - random leaves react more to gusts
    float gustTime = windTime * 2.0 * uGustFrequency + leafPhase;
    float gust = noise(vec3(worldPos.xz * 0.2 + randomPhase * 5.0, gustTime));
    gust = pow(gust, 2.0) * uGustStrength * (0.7 + randomIntensity * 0.6);
    
    // Combine wind forces with per-leaf intensity variation
    float leafIntensity = 0.7 + randomIntensity * 0.6;
    float windForce = (spatialWind * 0.5 + 0.5) * uWindStrength * leafIntensity + gust;
    
    // Sway factor - more movement at leaf tips
    float swayFactor = smoothstep(0.0, 1.0, uv.y);
    
    // === Leaf Flutter (Rotation) ===
    // Rotate leaf around its stem (local Y axis) for twisting
    // Each leaf twists at different rate and intensity
    float twistAngle = flutter * windForce * swayFactor * (0.6 + randomIntensity * 0.4);
    
    // Rotate around local X axis for flapping
    // Offset timing for more variety
    float flapSpeed = flutterSpeed * 1.3 + randomPhase * 3.14;
    float flapAngle = sin(flapSpeed) * windForce * swayFactor * (0.4 + randomSpeed * 0.4);
    
    // Apply rotations to position (rotate around center of leaf)
    vec3 animatedPos = position;
    
    // Offset to rotate around base of leaf
    vec3 pivot = vec3(0.0, -0.5, 0.0);
    animatedPos -= pivot;
    
    // Apply twist rotation (around Y)
    mat3 twistRot = rotateAxis(vec3(0.0, 1.0, 0.0), twistAngle);
    animatedPos = twistRot * animatedPos;
    
    // Apply flap rotation (around X)
    mat3 flapRot = rotateAxis(vec3(1.0, 0.0, 0.0), flapAngle);
    animatedPos = flapRot * animatedPos;
    
    animatedPos += pivot;
    
    // === Positional Sway ===
    // Gentle swaying motion - each leaf sways differently
    float swayPhase1 = windTime * 0.8 + leafPhase;
    float swayPhase2 = windTime * 0.9 + leafPhase + randomPhase * 2.0;
    
    float swayX = sin(swayPhase1) * uWindDirection.x;
    float swayZ = cos(swayPhase2) * uWindDirection.y;
    float swayY = sin(windTime * 1.2 + leafPhase) * 0.2; // Slight bob
    
    vec3 sway = vec3(swayX, swayY, swayZ) * windForce * swayFactor * 0.3;
    
    // Add turbulence with per-leaf offset
    float turbulence = noise(vec3(worldPos.xz * 1.5 + randomPhase * 3.0, windTime * 1.5));
    sway += vec3(turbulence - 0.5, 0.0, turbulence - 0.5) * windForce * swayFactor * 0.2;
    
    animatedPos += sway;
    
    // === Transform normals with rotation ===
    vec3 animatedNormal = normal;
    animatedNormal = twistRot * animatedNormal;
    animatedNormal = flapRot * animatedNormal;
    
    mat3 normalWorldMatrix = mat3(modelMatrix * instanceMatrix);
    vNormal = normalize(normalWorldMatrix * animatedNormal);
    
    vPosition = position;
    
    // Transform animated position
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(animatedPos, 1.0);
    vWorldPosition = (modelMatrix * instanceMatrix * vec4(animatedPos, 1.0)).xyz;
    
    gl_Position = projectionMatrix * mvPosition;
}
