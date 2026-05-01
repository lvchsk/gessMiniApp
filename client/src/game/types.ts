import type Phaser from 'phaser';

export type TileType = number | 'bomb';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  isBomb: boolean;
  sprite: Phaser.GameObjects.Image;
}

export type Grid = (Tile | null)[][];