const CAFE_GUIDE_STORAGE_KEY = 'bogema:cafe-guide:v1:completed';

export function isCafeGuideCompleted(): boolean {
  try {
    return window.localStorage.getItem(CAFE_GUIDE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markCafeGuideCompleted(): void {
  try {
    window.localStorage.setItem(CAFE_GUIDE_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage failures: the guide still closes for the current session.
  }
}

export function resetCafeGuideCompletion(): void {
  try {
    window.localStorage.removeItem(CAFE_GUIDE_STORAGE_KEY);
  } catch {
    // Ignore storage failures: replay can still be shown from state.
  }
}
