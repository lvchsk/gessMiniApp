import type Phaser from 'phaser';
import { getPreloadedImage } from '../lib/assetPreloader';
import { GEM_ASSET_COUNT } from './config';

const GEM_ASSET_PATHS = Array.from({ length: GEM_ASSET_COUNT }, (_, index) => ({
  key: `gem${index}`,
  path: `/assets/gem${index}.png`,
}));

const MATCH3_ASSET_PATHS = [
  ...GEM_ASSET_PATHS,
  { key: 'gem_bomb', path: '/assets/gem_bomb.png' },
];

export function registerPreloadedMatch3Textures(scene: Phaser.Scene): void {
  MATCH3_ASSET_PATHS.forEach(({ key, path }) => {
    if (scene.textures.exists(key)) {
      return;
    }

    const image = getPreloadedImage(path);
    if (image) {
      scene.textures.addImage(key, image);
    }
  });
}

export function queueMissingMatch3Textures(scene: Phaser.Scene): void {
  MATCH3_ASSET_PATHS.forEach(({ key, path }) => {
    if (!scene.textures.exists(key)) {
      scene.load.image(key, path);
    }
  });
}
