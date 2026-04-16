const MATCH3_SOUNDTRACK_SRC = '/assets/soundtrack3_in_a_row.m4a';
const MATCH3_VOLUME = 0.42;

let match3Audio: HTMLAudioElement | null = null;

function getMatch3Audio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return null;
  }

  if (!match3Audio) {
    match3Audio = new Audio(MATCH3_SOUNDTRACK_SRC);
    match3Audio.loop = true;
    match3Audio.preload = 'auto';
    match3Audio.volume = MATCH3_VOLUME;
  }

  return match3Audio;
}

export async function playMatch3Music(): Promise<boolean> {
  const audio = getMatch3Audio();
  if (!audio) {
    return false;
  }

  audio.volume = MATCH3_VOLUME;

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopMatch3Music(): void {
  const audio = getMatch3Audio();
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}
