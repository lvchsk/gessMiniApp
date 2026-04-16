const RUNNER_SOUNDTRACK_SRC = '/assets/soundtrack_runner.m4a';
const RUNNER_VOLUME = 0.42;

let runnerAudio: HTMLAudioElement | null = null;

function getRunnerAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return null;
  }

  if (!runnerAudio) {
    runnerAudio = new Audio(RUNNER_SOUNDTRACK_SRC);
    runnerAudio.loop = true;
    runnerAudio.preload = 'auto';
    runnerAudio.volume = RUNNER_VOLUME;
  }

  return runnerAudio;
}

export async function playRunnerMusic(): Promise<boolean> {
  const audio = getRunnerAudio();
  if (!audio) {
    return false;
  }

  audio.volume = RUNNER_VOLUME;

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopRunnerMusic(): void {
  const audio = getRunnerAudio();
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}
