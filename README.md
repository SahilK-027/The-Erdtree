# The Erdtree

An attempt to re-create The Erdtree, the massive golden world tree central to the lore of the video game Elden Ring, with three.js.

![The Erdtree](./thumbnail.png)

## ✨ Features

- **Volumetric God Rays** - Screen-space radial blur with depth-based fog
- **Custom Particle Systems** - GPU-accelerated flowfield particles with sparkle effects
- **Layered Tree Shader** - Fresnel-based rim lighting with scrolling energy textures
- **Falling Leaves System** - Physics-based leaf particles with wind displacement
- **Advanced Post-Processing** - Bloom, glow passes, and composite effects
- **Atmospheric Smoke** - Volumetric fog with noise-based animation
- **Audio Integration** - Ambient soundscape with spatial audio controls

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd the-erdtree

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **Three.js** (v0.182.0) - 3D graphics and WebGL rendering
- **GLSL** - Custom vertex and fragment shaders for advanced visual effects
- **Vite** (v7.0.0) - Lightning-fast build tool and development server
- **Tweakpane** (v4.0.5) - Real-time debug GUI controls
- **lil-gui** (v0.20.0) - Alternative debug interface
- **three-perf** (v1.0.11) - Performance monitoring and optimization
- **vite-plugin-glsl** (v1.5.1) - GLSL shader imports with hot reload
- **Sass** (v1.89.2) - CSS preprocessing

## 🎯 Inspiration

This project is a technical exploration of the rendering techniques used in Elden Ring's Erdtree. The implementation focuses on:

- Volumetric light shafts and atmospheric scattering
- Multi-layered holographic shader effects
- GPU-based particle simulation systems
- Advanced post-processing pipelines

For detailed technical breakdown, see [research documentation](./public/research/research.md).

## 🙏 Credits

### Music

- Background Music by [Ievgen Poltavskyi](https://pixabay.com/users/hitslab-47305729/) from [Pixabay](https://pixabay.com/music/)
- Narration by ElevenLabs

### 3D Models

- "Desert Ruins" by [Inknot](https://skfb.ly/6Xt9x) - Licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)

### Shaders

- Loader Shader by Jan Mróz (jaszunio15) - Licensed under CC BY 3.0

## 📄 License

This project is for educational and demonstration purposes.

---

Built with 💛 using Three.js and GLSL
