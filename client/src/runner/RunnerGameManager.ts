import Phaser from 'phaser';
import RunnerScene from './RunnerScene';
import { RUNNER_HEIGHT, RUNNER_WIDTH } from './config';
import type { RunnerCallbacks } from './types';

export class RunnerGameManager {
  private game: Phaser.Game | null = null;

  mount(container: HTMLDivElement, callbacks: RunnerCallbacks): void {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: RUNNER_WIDTH,
      height: RUNNER_HEIGHT,
      parent: container,
      backgroundColor: '#f7cb8a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false,
        },
      },
      scene: [new RunnerScene(callbacks)],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }
}

let hasWarmedRunnerGame = false;

export function warmRunnerGame(): void {
  if (hasWarmedRunnerGame || typeof document === 'undefined') {
    return;
  }

  hasWarmedRunnerGame = true;

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = [
    'position:fixed',
    'left:-9999px',
    'top:-9999px',
    `width:${RUNNER_WIDTH}px`,
    `height:${RUNNER_HEIGHT}px`,
    'opacity:0',
    'overflow:hidden',
    'pointer-events:none',
  ].join(';');

  document.body.appendChild(container);

  const manager = new RunnerGameManager();
  manager.mount(container, {});

  window.setTimeout(() => {
    manager.destroy();
    container.remove();
  }, 250);
}
