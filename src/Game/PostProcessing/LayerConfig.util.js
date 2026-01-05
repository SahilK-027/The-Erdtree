// Layer Configuration
// Note: Layer 0 is the default layer in Three.js
export const LAYERS = {
  NO_FX: 0, // Objects with no effects (default layer)
  GLOW: 1, // Objects with custom glow post-processing
  BLOOM: 2, // Objects with bloom effect
};

// Define which layers are visible for each render pass
export const PASS_CONFIG = {
  GLOW_CAPTURE: [LAYERS.GLOW], // Pass 1
  BLOOM_RENDER: [LAYERS.BLOOM], // Pass 2
  MAIN_SCENE: [LAYERS.BLOOM, LAYERS.NO_FX], // Pass 3 - GLOW excluded, only post-processed effect shows
};
