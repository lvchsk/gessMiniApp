import type { Grid, Tile } from './types';

export function collectExplosion(
  grid: Grid,
  start: Tile[]
): Tile[] {
  const result = new Set<Tile>();
  const queue: Tile[] = [...start];
  const visited = new Set<string>();

  const key = (t: Tile) => `${t.x}:${t.y}`;

  while (queue.length > 0) {
    const bomb = queue.shift();
    if (!bomb) continue;

    visited.add(key(bomb));

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = bomb.x + dx;
        const y = bomb.y + dy;

        if (!grid[y] || !grid[y][x]) continue;

        const tile = grid[y][x];
        if (!tile) continue;

        result.add(tile);

        if (tile.isBomb && !visited.has(key(tile))) {
          queue.push(tile);
        }
      }
    }
  }

  return Array.from(result);
}