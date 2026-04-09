import Phaser from "phaser";
import type { Grid, Tile } from "./types";
import { TILE_TYPES } from "./config";

export function refill(
  _scene: Phaser.Scene,
  grid: Grid,
  createTile: (x: number, y: number, type: number, spawnY: number) => Tile,
): Tile[] {
  const created: Tile[] = [];
  const size = grid.length;

  for (let x = 0; x < size; x++) {
    let emptyCount = 0;

    for (let y = size - 1; y >= 0; y--) {
      if (!grid[y][x]) emptyCount++;
    }

    for (let y = 0; y < size; y++) {
      if (grid[y][x]) continue;

      const type = Phaser.Math.Between(0, TILE_TYPES - 1);

      // спавн выше экрана
      const spawnY = y - emptyCount;

      const tile = createTile(x, y, type, spawnY);

      grid[y][x] = tile;
      created.push(tile);

      emptyCount--;
    }
  }

  return created;
}
