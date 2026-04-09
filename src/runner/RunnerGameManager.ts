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
