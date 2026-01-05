# Render Pipeline & Layer System

The renderer uses a multi-pass pipeline with Three.js layers to apply different effects to different objects.

## Layer Configuration

Layers are defined in `LayerConfig.util.js`:

```javascript
import { LAYERS } from './PostProcessing/LayerConfig.util';

// Available layers:
LAYERS.NO_FX  // 0 - Objects rendered normally, no post-processing
LAYERS.GLOW   // 1 - Objects captured for god rays effect (hidden in final scene)
LAYERS.BLOOM  // 2 - Objects with bloom effect applied
```

## Assigning Layers to Meshes

```javascript
// Normal rendering - no effects
mesh.layers.set(LAYERS.NO_FX);

// God rays source - mesh is captured but hidden, only the rays show
mesh.layers.set(LAYERS.GLOW);

// Bloom effect - mesh renders with bloom glow
mesh.layers.set(LAYERS.BLOOM);
```

## Render Pass Order

The `RenderPipeline` executes 5 passes per frame:

| Pass | Description | Layers Visible |
|------|-------------|----------------|
| 1 | Capture glow objects to render target | `GLOW` |
| 2 | Render bloom layer with UnrealBloomPass | `BLOOM` |
| 3 | Render main scene to screen | `BLOOM`, `NO_FX` |
| 4 | Composite bloom additively | - |
| 5 | Composite god rays additively | - |

## How Layers Work

Every mesh and camera has a `layers` bitmask. When rendering, Three.js only draws meshes where the mesh's layer overlaps with the camera's enabled layers.

```javascript
// Camera sees only layer 1
camera.layers.set(1);

// Camera sees layers 0 and 2
camera.layers.set(0);
camera.layers.enable(2);
```

## Adding New Effects

1. Define a new layer in `LayerConfig.util.js`
2. Create a new pass in `Passes/`
3. Update `PASS_CONFIG` to include your layer in the appropriate passes
4. Add the pass to `PostProcessing.class.js` and `RenderPipeline.class.js`

## Debug Controls

When debug mode is enabled (`?debug` URL param), tweakable controls appear for:
- Camera (FOV, position, damping)
- Bloom (strength, radius, threshold)
- Composite (enable/disable bloom & glow, color)
- Glow Sphere (rotation, tile, cutoff, feather, height, color)
- Renderer (tone mapping)
- Performance (FPS graph, memory)
