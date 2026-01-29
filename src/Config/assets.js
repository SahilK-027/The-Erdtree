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
    id: 'ruinsModel',
    type: 'gltfModelCompressed',
    path: '/assets/models/ruins.compressed.glb',
  },
  {
    id: 'smokeTexture',
    type: 'texture',
    path: '/assets/textures/smoke/smoke.png',
  },
  {
    id: 'groundDiffuseMap',
    type: 'texture',
    path: '/assets/textures/ground/brown_mud_leaves_01_diff_1k.jpg',
  },
  {
    id: 'groundNormalMap',
    type: 'texture',
    path: '/assets/textures/ground/brown_mud_leaves_01_nor_dx_1k.jpg',
  },
  {
    id: 'groundAOMap',
    type: 'texture',
    path: '/assets/textures/ground/brown_mud_leaves_01_ao_1k.jpg',
  },
  {
    id: 'bgMusic',
    type: 'audio',
    path: '/assets/music/jungle-forest-wildlife-background-music-326441.mp3',
  },
  {
    id: 'introNarration',
    type: 'audio',
    path: '/assets/music/ElevenLabs_2026-01-29T12_08_10_Nigel Graves - Mysterious, Deep Narrator_pvc_sp94_s50_sb75_se0_b_m2.mp3',
  },
];

export default ASSETS;
