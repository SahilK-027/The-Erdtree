varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vRandomness;

attribute float instanceRandomness;

void main() {
    // Transform normal to world space (not view space)
    // This keeps normals independent of camera orientation
    mat3 normalWorldMatrix = mat3(modelMatrix * instanceMatrix);
    vNormal = normalize(normalWorldMatrix * normal);
    
    vPosition = position;
    vUv = uv;
    
    // Use instance ID to generate per-leaf randomness
    float instanceId = float(gl_InstanceID);
    vRandomness = fract(sin(instanceId * 12.9898) * 43758.5453);
    
    // Transform position
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vWorldPosition = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
    
    gl_Position = projectionMatrix * mvPosition;
}
