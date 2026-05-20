export interface AssetPreloadProgress {
  loaded: number;
  total: number;
  progress: number;
}

type AssetKind = 'font' | 'image';

interface AssetEntry {
  kind: AssetKind;
  path: string;
}

const ASSETS_TO_PRELOAD: AssetEntry[] = [
  { kind: 'font', path: '/fonts/Akedopikuseru-Regular.otf' },
  { kind: 'image', path: '/assets/start_menu.PNG' },
  { kind: 'image', path: '/assets/menu_main.jpg' },
  { kind: 'image', path: '/assets/menu_main.webp' },
  { kind: 'image', path: '/assets/spritesheet_runner.jpg' },
  { kind: 'image', path: '/assets/runner_apparat.png' },
  { kind: 'image', path: '/assets/runner_hero.png' },
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
  { kind: 'image', path: '/assets/kepka_coin.png' },
  { kind: 'image', path: '/assets/nichego_сoin.png' },
  { kind: 'image', path: '/assets/music_on.png' },
  { kind: 'image', path: '/assets/music_off.png' },
  { kind: 'image', path: '/assets/leader_1.svg' },
  { kind: 'image', path: '/assets/leader_2.svg' },
  { kind: 'image', path: '/assets/leader_3.svg' },
  { kind: 'image', path: '/favicon.svg' },
  { kind: 'image', path: '/icons.svg' },
];

function preloadImage(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      if ('decode' in image) {
        image.decode().then(resolve).catch(() => resolve());
        return;
      }

      resolve();
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
  const total = ASSETS_TO_PRELOAD.length;
  let loaded = 0;

  onProgress({ loaded, total, progress: 0 });

  await Promise.all(
    ASSETS_TO_PRELOAD.map(async (asset) => {
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
