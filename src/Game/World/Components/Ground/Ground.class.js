import * as THREE from 'three';
import Game from '../../../Game.class';

export default class Ground {
  constructor(options = {}) {
    this.game = Game.getInstance();
    this.scene = this.game.scene;
    this.resources = this.game.resources;
    this.debug = this.game.debug;
    this.isDebugEnabled = this.game.isDebugEnabled;

    // Options for procedural ground
    this.params = {
      size: options.size || 200,
      textureRepeat: options.textureRepeat || 120,
      roughness: options.roughness || 1.0,
      metalness: options.metalness || 0.2,
      positionY: options.positionY || 0,
      color: options.color || '#b2a980',
      visible: true,
      receiveShadow: true,
      ...options,
    };

    this.createGround();

    if (this.isDebugEnabled) {
      this.initTweakPane();
    }
  }

  createGround() {
    // Get textures from ResourceLoader
    const diffuseMap = this.resources.items.groundDiffuseMap;
    const normalMap = this.resources.items.groundNormalMap;
    const aoMap = this.resources.items.groundAOMap;
    const roughnessMap = this.resources.items.groundRoughnessMap;

    // Configure texture wrapping and repeat
    [diffuseMap, normalMap, aoMap, roughnessMap].forEach((texture) => {
      if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(
          this.params.textureRepeat,
          this.params.textureRepeat,
        );
      }
    });

    // Set color space for diffuse map
    if (diffuseMap) {
      diffuseMap.colorSpace = THREE.SRGBColorSpace;
    }

    const geometry = new THREE.PlaneGeometry(
      this.params.size,
      this.params.size,
      128,
      128,
    );

    this.material = new THREE.MeshStandardMaterial({
      map: diffuseMap,
      normalMap: normalMap,
      aoMap: aoMap,
      roughness: this.params.roughness,
      fog: true,
      color: new THREE.Color(this.params.color),
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = this.params.positionY;
    this.mesh.receiveShadow = this.params.receiveShadow;
    this.mesh.visible = this.params.visible;

    // AO map requires a second UV set
    this.mesh.geometry.setAttribute(
      'uv2',
      new THREE.BufferAttribute(this.mesh.geometry.attributes.uv.array, 2),
    );

    this.scene.add(this.mesh);
  }

  initTweakPane() {
    const folder = 'Ground';

    this.debug.add(
      this.params,
      'visible',
      {
        label: 'Visible',
        onChange: (v) => {
          this.mesh.visible = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'positionY',
      {
        label: 'Position Y',
        min: -5,
        max: 5,
        step: 0.1,
        onChange: (v) => {
          this.mesh.position.y = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'textureRepeat',
      {
        label: 'Texture Repeat',
        min: 1,
        max: 200,
        step: 1,
        onChange: (v) => {
          [
            this.material.map,
            this.material.normalMap,
            this.material.aoMap,
            this.material.roughnessMap,
          ].forEach((texture) => {
            if (texture) {
              texture.repeat.set(v, v);
            }
          });
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'roughness',
      {
        label: 'Roughness',
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (v) => {
          this.material.roughness = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'metalness',
      {
        label: 'Metalness',
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (v) => {
          this.material.metalness = v;
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'color',
      {
        label: 'Color Tint',
        color: true,
        onChange: (v) => {
          this.material.color.set(v);
        },
      },
      folder,
    );

    this.debug.add(
      this.params,
      'receiveShadow',
      {
        label: 'Receive Shadow',
        onChange: (v) => {
          this.mesh.receiveShadow = v;
        },
      },
      folder,
    );
  }

  destroy() {
    this.mesh.geometry?.dispose();
    this.material?.dispose();
    this.scene.remove(this.mesh);
  }
}
