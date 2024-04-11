import * as THREE from "three";
import {
  BASE_LAYER,
  HAZE_MAX,
  HAZE_MIN,
  HAZE_OPACITY,
} from "../config/renderConfig.js";
import { clamp } from "../utils.js";

// Lazily load the texture to ensure this operation only happens on the client-side
let hazeTexturePromise;
function loadHazeTexture() {
  if (!hazeTexturePromise) {
    hazeTexturePromise = new THREE.TextureLoader().load(
      "../resources/feathered60.png"
    );
  }
  return hazeTexturePromise;
}

export class Haze {
  constructor(position) {
    this.position = position;
    this.obj = null;
  }

  async toThreeObject(scene) {
    const hazeTexture = await loadHazeTexture();
    const hazeSprite = new THREE.SpriteMaterial({
      map: hazeTexture,
      color: 0x0082ff,
      opacity: HAZE_OPACITY,
      depthTest: false,
      depthWrite: false,
    });

    let sprite = new THREE.Sprite(hazeSprite);
    sprite.layers.set(BASE_LAYER);
    sprite.position.copy(this.position);

    // varying size of dust clouds
    sprite.scale.multiplyScalar(
      clamp(HAZE_MAX * Math.random(), HAZE_MIN, HAZE_MAX)
    );

    this.obj = sprite;
    scene.add(sprite);
  }

  updateScale(camera) {
    let dist = this.position.distanceTo(camera.position) / 250;
    if (this.obj) {
      this.obj.material.opacity = clamp(
        HAZE_OPACITY * Math.pow(dist / 2.5, 2),
        0,
        HAZE_OPACITY
      );
      this.obj.material.needsUpdate = true;
    }
  }
}
