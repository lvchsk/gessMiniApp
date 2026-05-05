const MUSIC_PREFERENCE_STORAGE_KEY = 'gess-mini-app:music-enabled';

export const MUSIC_PREFERENCE_CHANGE_EVENT = 'game-music:preference-change';

export function isGameMusicEnabled(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage.getItem(MUSIC_PREFERENCE_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setGameMusicEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (enabled) {
      window.localStorage.removeItem(MUSIC_PREFERENCE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(MUSIC_PREFERENCE_STORAGE_KEY, 'off');
    }
  } catch {
    // If storage is blocked, the current session still receives the change event.
  }

  window.dispatchEvent(
    new CustomEvent(MUSIC_PREFERENCE_CHANGE_EVENT, {
      detail: { enabled },
    }),
  );
}
