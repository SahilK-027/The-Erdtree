To my understanding "The Erdtree is less of a "tree" and more of a colossal, light-emitting volume".

- https://youtu.be/RLOoN3l2zvE?si=SOxIN6e5KJC0-3yN

- https://mamoniem.com/behind-the-pretty-frames-elden-ring/ LightShaft Section

## Break down of the major shader components and techniques to use:

1. The Trunk/Branches - Layered Approach
   The trunk likely uses:

- Fresnel effect - Makes edges glow more than surfaces facing the camera
- Scrolling noise texture - Creates that flowing, ethereal energy look
- Additive blending - Layered multiple times with different speeds/scales
- Vertex displacement - Subtle animation to make it feel alive
- Emission multiplier - Cranked way up for that radiant glow

You cannot achieve that deep, volumetric glow with a single mesh. The Erdtree likely uses multiple mesh layers (duplicate geometry) to create the illusion of a dense core and a gaseous outer shell.

Layer A (Core): A slightly smaller, opaque mesh. This carries the "hard" gold color so the tree doesn't look like a ghost.

Layer B (Shell): A slightly scaled-up duplicate mesh (normals pushed out). This is where the Holographic Shader lives. This layer is semi-transparent and additive.

The "glooming holographic" effect you see is primarily a combination of Fresnel, Scrolling UVs, and Alpha Erosion.

A. The Glow (Fresnel Effect)
This is the most critical component. The tree is brighter at the edges and fades in the center, giving it that ethereal look.

The Math: Calculate the dot product between the Camera View Direction and the Surface Normal.

float fresnel = dot(viewDir, worldNormal);

fresnel = pow(1.0 - fresnel, exponent);

The Result: The pixels pointing away from you (the edges of the trunk) become 1 (white/bright), and pixels facing you become 0 (transparent).

The Color: Multiply this result by a high-intensity HDR Gold color (e.g., RGB [5, 3, 0.5]) to trigger the game's Bloom effect.

B. The "Flowing" Energy (Texture Scrolling)
The trunk isn't static; it looks like liquid gold is flowing up it.

The Texture: You need a tiling noise texture (like Perlin or Voronoi noise) or a specific "vein" mask.

The Movement: Instead of animating the geometry, you animate the UV coordinates.

float2 uvOffset = float2(0, \_Time \* speed);

float4 noise = tex2D(\_NoiseMap, uv + uvOffset);

Decompilation: The shader takes this scrolling noise and multiplies it by the Emissive Color. This creates "waves" of light traveling up the trunk.

C. The "Gloaming" (Alpha Erosion)
To make it look "ghostly" rather than plastic, parts of the trunk need to be invisible.

Technique: Use a second scrolling noise texture (different scale/speed) to cut holes in the Alpha channel.

Interaction: Where the noise is black, the tree renders nothing. Where white, it renders the hologram. This breaks up the silhouette so it doesn't look like a solid 3D model.

3. The "Erdtree Shader" Pseudo-Code
   If we were writing this in HLSL (High-Level Shader Language), the pixel shader would look roughly like this:

```c
// 1. SCROLLING ENERGY
// Scroll a noise texture upwards over time
float scrollUV = i.uv + float2(0, _Time.y * _FlowSpeed);
float energyMask = tex2D(_NoiseTex, scrollUV).r;

// 2. FRESNEL (RIM LIGHT)
// Calculate rim light so edges glow
float viewDot = dot(normalize(i.viewDir), normalize(i.normal));
float fresnel = pow(1.0 - saturate(viewDot), _FresnelPower);

// 3. COMBINE
// The glow appears where the energy mask is bright AND where the fresnel is strong
float finalEmission = _GoldColor * energyMask * fresnel * _EmissionIntensity;

// 4. ALPHA
// Base opacity + extra opacity at the edges
float alpha = _BaseAlpha + fresnel;

return float(finalEmission, alpha);
```

### The "Real" Recipe:

1. The Mesh: Create a twisted tree trunk. Duplicate it and scale it up by 1.05x (The Shell).

2. The Inner Shader: Solid gold, unlit, standard material.

3. The Outer Shader:

   - Blend Mode: Additive (One One).

   - Texture: A seamless "caustic" noise texture scrolling vertically.

   - Fresnel: Heavy rim lighting.

4. The Foliage - Particle Systems + Mesh Combo

- Billboard particles with alpha-tested leaf textures
- Color gradient (golden to white at the crown)
- Wind displacement shader on both particles and mesh leaves
- Possible subsurface scattering on denser leaf clusters

3. Volumetric Lighting (The God Rays)

- Radial blur post-process emanating from the tree center
- Depth-based volumetric fog shader
- Light shafts calculated in screen space or volumetric raymarch
- Atmospheric scattering

4. Particle Effects

- Floating embers/light particles
- Gradient over lifetime (birth to death)
- Velocity-based stretching
- Soft particle blending with scene depth

5. Post-Processing

- Bloom (heavy!)
- Chromatic aberration at edges
- Vignette
- Tone mapping to handle the extreme brightness range
- Possible lens flare elements

6. Ground Interaction

- Decal projectors for the light pools on the ground
- Fog sheets with noise scrolling
