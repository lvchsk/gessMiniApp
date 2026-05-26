import { CAFE_GUIDE_STEPS } from '../cafeGuide/guideSteps';

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
const PRESS_START_2P_STYLESHEET_URL =
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';

const ASSETS_TO_PRELOAD: AssetEntry[] = [
  { kind: 'font', path: PRESS_START_2P_STYLESHEET_URL },
  { kind: 'image', path: '/assets/start_menu.jpg' },
  { kind: 'image', path: '/assets/menu_main.webp' },
  { kind: 'image', path: '/assets/spritesheet_runner.webp' },
  { kind: 'image', path: '/assets/runner_background.webp' },
  { kind: 'image', path: '/assets/runner_apparat.webp?v=2' },
  { kind: 'image', path: '/assets/runner_menu_preview.webp' },
  { kind: 'image', path: '/assets/runner_hero.webp' },
  { kind: 'image', path: '/assets/shagi_preload.png' },
  ...CAFE_GUIDE_STEPS.map((step) => ({ kind: 'image' as const, path: step.asset })),
  ...Array.from({ length: 9 }, (_, index) => ({
    kind: 'image' as const,
    path: `/assets/gost_menu_${index + 1}.svg`,
  })),
  ...Array.from({ length: 9 }, (_, index) => ({
    kind: 'image' as const,
    path: `/assets/kepka_menu_${index + 1}.svg`,
  })),
  ...Array.from({ length: 9 }, (_, index) => ({
    kind: 'image' as const,
    path: `/assets/kepka_menu_${index + 1}_sprite.svg`,
  })),
  { kind: 'image', path: '/assets/gem0.webp' },
  { kind: 'image', path: '/assets/gem1.webp' },
  { kind: 'image', path: '/assets/gem2.webp' },
  { kind: 'image', path: '/assets/gem3.webp' },
  { kind: 'image', path: '/assets/gem4.webp' },
  { kind: 'image', path: '/assets/gem5.webp' },
  { kind: 'image', path: '/assets/gem6.webp' },
  { kind: 'image', path: '/assets/gem7.webp' },
  { kind: 'image', path: '/assets/gem8.webp' },
  { kind: 'image', path: '/assets/gem_bomb.webp' },
  { kind: 'audio', path: '/assets/soundtrack3_in_a_row.mp3' },
  { kind: 'audio', path: '/assets/soundtrack_menu_main.mp3' },
  { kind: 'audio', path: '/assets/soundtrack_runner.m4a' },
  { kind: 'audio', path: '/assets/soundtrack_runner_underdog.mp3' },
  { kind: 'image', path: '/assets/kepka_coin.webp' },
  { kind: 'image', path: '/assets/nichego_coin.webp' },
  { kind: 'image', path: '/assets/music_on.webp?v=2' },
  { kind: 'image', path: '/assets/music_off.webp?v=2' },
  { kind: 'image', path: '/assets/leader_1.svg' },
  { kind: 'image', path: '/assets/leader_2.svg' },
  { kind: 'image', path: '/assets/leader_3.svg' },
];

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
    await document.fonts.load('1em "Press Start 2P"');
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
  const total = ASSETS_TO_PRELOAD.length;
  let loaded = 0;

  onProgress({ loaded, total, progress: 0 });

  await Promise.all(
    ASSETS_TO_PRELOAD.map(async (asset) => {
      await preloadAsset(asset);

      loaded += 1;
      onProgress({
        loaded,
        total,
        progress: total > 0 ? loaded / total : 1,
      });
    }),
  );
}

export function getPreloadedImage(path: string): HTMLImageElement | null {
  return preloadedImages.get(path) ?? null;
}
