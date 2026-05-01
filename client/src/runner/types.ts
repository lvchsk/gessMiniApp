import Phaser from 'phaser';

export interface RunnerCallbacks {
  onScoreChange?: (score: number) => void;
  onGameOverChange?: (isGameOver: boolean) => void;
}

export interface RunnerObstacle extends Phaser.Physics.Arcade.Sprite {
  passed?: boolean;
  kind?: 'single' | 'double';
}

export interface RunnerSpawnSpec {
  kind: 'single' | 'double';
  offset: number;
}

export interface RunnerPattern {
  obstacles: RunnerSpawnSpec[];
  minGap: number;
}
