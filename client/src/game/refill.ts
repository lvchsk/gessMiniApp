import Phaser from "phaser";
import type { Grid, Tile } from "./types";
import { TILE_TYPES } from "./config";

export function refill(
  _scene: Phaser.Scene,
  grid: Grid,
  createTile: (x: number, y: number, type: number, spawnY: number) => Tile,
): Tile[] {
  const created: Tile[] = [];
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;

  for (let x = 0; x < columns; x++) {
    let emptyCount = 0;

    for (let y = rows - 1; y >= 0; y--) {
      if (!grid[y][x]) emptyCount++;
    }

    for (let y = 0; y < rows; y++) {
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
