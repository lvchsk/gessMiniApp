const MENU_MAIN_SOUNDTRACK_SRC = '/assets/soundtrack_menu_main.mp3';
const MENU_MAIN_VOLUME = 0.38;

let menuMainAudio: HTMLAudioElement | null = null;

function getMenuMainAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return null;
  }

  if (!menuMainAudio) {
    menuMainAudio = new Audio(MENU_MAIN_SOUNDTRACK_SRC);
    menuMainAudio.loop = true;
    menuMainAudio.preload = 'auto';
    menuMainAudio.volume = MENU_MAIN_VOLUME;
  }

  return menuMainAudio;
}

export async function playMenuMainMusic(): Promise<boolean> {
  const audio = getMenuMainAudio();
  if (!audio) {
    return false;
  }

  audio.volume = MENU_MAIN_VOLUME;

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopMenuMainMusic(): void {
  const audio = getMenuMainAudio();
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}
