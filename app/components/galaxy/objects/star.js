import * as THREE from "three";
import { BLOOM_LAYER, STAR_MAX, STAR_MIN } from "../config/renderConfig.js";
import { starTypes } from "../config/starDistributions.js";
import { clamp } from "../utils.js";

// Refactor to lazily load the texture
let texturePromise;
function loadTexture() {
  if (!texturePromise) {
    texturePromise = new THREE.TextureLoader().load(
      "../resources/sprite120.png"
    );
  }
  return texturePromise;
}

export class Star {
  constructor(position) {
    this.position = position;
    this.starType = this.generateStarType();
    this.obj = null;
    this.materials = null;
  }

  generateStarType() {
    let num = Math.random() * 100.0;
    let pct = starTypes.percentage;
    for (let i = 0; i < pct.length; i++) {
      num -= pct[i];
      if (num < 0) {
        return i;
      }
    }
    return 0;
  }

  updateScale(camera) {
    let dist = this.position.distanceTo(camera.position) / 250;

    // update star size
    let starSize = dist * starTypes.size[this.starType];
    starSize = clamp(starSize, STAR_MIN, STAR_MAX);
    this.obj?.scale.copy(new THREE.Vector3(starSize, starSize, starSize));
  }

  async toThreeObject(scene) {
    if (!this.materials) {
      const texture = await loadTexture();
      this.materials = starTypes.color.map(
        (color) => new THREE.SpriteMaterial({ map: texture, color })
      );
    }
    let sprite = new THREE.Sprite(this.materials[this.starType]);
    sprite.layers.set(BLOOM_LAYER);

    sprite.scale.multiplyScalar(starTypes.size[this.starType]);
    sprite.position.copy(this.position);

    this.obj = sprite;

    scene.add(sprite);
  }
}
