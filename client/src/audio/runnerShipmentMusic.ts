import { isGameMusicEnabled } from './musicPreference';

const RUNNER_SHIPMENT_SOUNDTRACK_SRC = '/assets/soundtrack_runner_underdog.mp3';
const RUNNER_SHIPMENT_VOLUME = 0.56;

let shipmentAudio: HTMLAudioElement | null = null;

function getShipmentAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return null;
  }

  if (!shipmentAudio) {
    shipmentAudio = new Audio(RUNNER_SHIPMENT_SOUNDTRACK_SRC);
    shipmentAudio.loop = true;
    shipmentAudio.preload = 'auto';
    shipmentAudio.volume = RUNNER_SHIPMENT_VOLUME;
  }

  return shipmentAudio;
}

export async function playRunnerShipmentMusic(): Promise<boolean> {
  if (!isGameMusicEnabled()) {
    return false;
  }

  const audio = getShipmentAudio();
  if (!audio) {
    return false;
  }

  audio.volume = RUNNER_SHIPMENT_VOLUME;

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopRunnerShipmentMusic(): void {
  const audio = getShipmentAudio();
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}
