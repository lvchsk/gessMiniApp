import { CAFE_GUIDE_STEPS } from '../cafeGuide/guideSteps';
import akedopikuseruFontUrl from '../assets/fonts/Akedopikuseru-Regular.otf?url';

export interface AssetPreloadProgress {
  loaded: number;
  total: number;
  progress: number;
}

type AssetKind = 'audio' | 'font' | 'image';

interface AssetEntry {
  kind: AssetKind;
  path: string;
}

const preloadedImages = new Map<string, HTMLImageElement>();

const ASSETS_TO_PRELOAD: AssetEntry[] = [
  { kind: 'font', path: akedopikuseruFontUrl },
  { kind: 'image', path: '/assets/start_menu.PNG' },
  { kind: 'image', path: '/assets/menu_main.jpg' },
  { kind: 'image', path: '/assets/menu_main.webp' },
  { kind: 'image', path: '/assets/spritesheet_runner.jpg' },
  { kind: 'image', path: '/assets/runner_apparat.png?v=2' },
  { kind: 'image', path: '/assets/runner_menu_preview.png' },
  { kind: 'image', path: '/assets/runner_hero.png' },
  ...CAFE_GUIDE_STEPS.map((step) => ({ kind: 'image' as const, path: step.asset })),
  { kind: 'image', path: '/assets/gem0.png' },
  { kind: 'image', path: '/assets/gem1.png' },
  { kind: 'image', path: '/assets/gem2.png' },
  { kind: 'image', path: '/assets/gem3.png' },
  { kind: 'image', path: '/assets/gem4.png' },
  { kind: 'image', path: '/assets/gem5.png' },
  { kind: 'image', path: '/assets/gem6.png' },
  { kind: 'image', path: '/assets/gem7.png' },
  { kind: 'image', path: '/assets/gem8.png' },
  { kind: 'image', path: '/assets/gem_bomb.png' },
  { kind: 'audio', path: '/assets/soundtrack3_in_a_row.m4a' },
  { kind: 'audio', path: '/assets/soundtrack_runner.m4a' },
  { kind: 'image', path: '/assets/kepka_coin.png' },
  { kind: 'image', path: '/assets/nichego_coin.png' },
  { kind: 'image', path: '/assets/music_on.png' },
  { kind: 'image', path: '/assets/music_off.png' },
  { kind: 'image', path: '/assets/leader_1.svg' },
  { kind: 'image', path: '/assets/leader_2.svg' },
  { kind: 'image', path: '/assets/leader_3.svg' },
  { kind: 'image', path: '/favicon.svg' },
  { kind: 'image', path: '/icons.svg' },
];

const GAME_ASSET_PATHS = new Set([
  '/assets/spritesheet_runner.jpg',
  '/assets/runner_apparat.png?v=2',
  '/assets/runner_menu_preview.png',
  '/assets/runner_hero.png',
  '/assets/gem0.png',
  '/assets/gem1.png',
  '/assets/gem2.png',
  '/assets/gem3.png',
  '/assets/gem4.png',
  '/assets/gem5.png',
  '/assets/gem6.png',
  '/assets/gem7.png',
  '/assets/gem8.png',
  '/assets/gem_bomb.png',
  '/assets/soundtrack3_in_a_row.m4a',
  '/assets/soundtrack_runner.m4a',
  '/assets/kepka_coin.png',
  '/assets/nichego_coin.png',
]);

function isGameAsset(asset: AssetEntry): boolean {
  return GAME_ASSET_PATHS.has(asset.path);
}

const APP_SHELL_ASSETS_TO_PRELOAD = ASSETS_TO_PRELOAD.filter(
  (asset) => !isGameAsset(asset),
);
const GAME_ASSETS_TO_PRELOAD = ASSETS_TO_PRELOAD.filter(isGameAsset);

let gameAssetsPreloadPromise: Promise<void> | null = null;

function preloadImage(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const finish = () => {
      preloadedImages.set(path, image);
      resolve();
    };

    image.onload = () => {
      if ('decode' in image) {
        image.decode().then(finish).catch(finish);
        return;
      }

      finish();
    };
    image.onerror = () => reject(new Error(`Failed to preload image: ${path}`));
    image.src = path;
  });
}

async function preloadFetchableAsset(path: string): Promise<void> {
  const response = await fetch(path, { cache: 'force-cache' });

  if (!response.ok) {
    throw new Error(`Failed to preload asset: ${path}`);
  }

  await response.arrayBuffer();
}

async function preloadFont(path: string): Promise<void> {
  await preloadFetchableAsset(path);

  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.load('1em Akedopikuseru');
  }
}

async function preloadAsset(asset: AssetEntry): Promise<void> {
  if (asset.kind === 'image') {
    await preloadImage(asset.path);
    return;
  }

  if (asset.kind === 'font') {
    await preloadFont(asset.path);
    return;
  }

  await preloadFetchableAsset(asset.path);
}

export async function preloadAppAssets(
  onProgress: (progress: AssetPreloadProgress) => void,
): Promise<void> {
  const total = APP_SHELL_ASSETS_TO_PRELOAD.length;
  let loaded = 0;

  onProgress({ loaded, total, progress: 0 });

  await Promise.all(
    APP_SHELL_ASSETS_TO_PRELOAD.map(async (asset) => {
      try {
        await preloadAsset(asset);
      } catch (error) {
        console.warn(error);
      } finally {
        loaded += 1;
        onProgress({
          loaded,
          total,
          progress: total > 0 ? loaded / total : 1,
        });
      }
    }),
  );
}

export function preloadGameAssetsInBackground(): Promise<void> {
  gameAssetsPreloadPromise ??= Promise.all(
    GAME_ASSETS_TO_PRELOAD.map(async (asset) => {
      try {
        await preloadAsset(asset);
      } catch (error) {
        console.warn(error);
      }
    }),
  ).then(() => undefined);

  return gameAssetsPreloadPromise;
}

export function getPreloadedImage(path: string): HTMLImageElement | null {
  return preloadedImages.get(path) ?? null;
}
