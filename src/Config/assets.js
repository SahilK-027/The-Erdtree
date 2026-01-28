const ASSETS = [
  {
    id: 'environmentMapTexture',
    type: 'cubeMap',
    path: [
      '/assets/environmentMap/px.png',
      '/assets/environmentMap/nx.png',
      '/assets/environmentMap/py.png',
      '/assets/environmentMap/ny.png',
      '/assets/environmentMap/pz.png',
      '/assets/environmentMap/nz.png',
    ],
  },
  {
    id: 'godraysPatternMap',
    type: 'texture',
    path: '/assets/textures/godrays/godrays_pattern.png',
  },
  {
    id: 'erdtreeModel',
    type: 'gltfModelCompressed',
    path: '/assets/models/erdtree.glb',
  },
  {
    id: 'leafModel',
    type: 'gltfModelCompressed',
    path: '/assets/models/leaf.glb',
  },
  {
    id: 'smokeTexture',
    type: 'texture',
    path: '/assets/textures/smoke/smoke.png',
  },
];

export default ASSETS;
