import type { Grid, Tile } from './types';

export function collapse(grid: Grid): Tile[] {
  const moved: Tile[] = [];
  const size = grid.length;

  for (let x = 0; x < size; x++) {
    let writeY = size - 1;

    for (let y = size - 1; y >= 0; y--) {
      const tile = grid[y][x];

      if (!tile) continue;

      if (y !== writeY) {
        grid[writeY][x] = tile;
        grid[y][x] = null;

        tile.y = writeY;
        tile.x = x;

        moved.push(tile);
      }

      writeY--;
    }

// очистка сверху:

    for (let y = writeY; y >= 0; y--) {
      grid[y][x] = null;
    }
  }

  return moved;
}