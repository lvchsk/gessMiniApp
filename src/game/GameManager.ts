import Phaser from 'phaser';
import Match3Scene from './Match3Scene';
import { GAME_WIDTH, GAME_HEIGHT } from './config';

export interface GameCallbacks {
  onScoreChange?: (score: number) => void;
}

export class GameManager {
  private game: Phaser.Game | null = null;

  mount(container: HTMLDivElement, callbacks: GameCallbacks): void {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: container,
      backgroundColor: '#111',
      scene: [new Match3Scene(callbacks)],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      }
    });
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }
}
