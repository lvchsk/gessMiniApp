import type { Grid, Tile } from './types';

export function findMatchGroups(grid: Grid): Tile[][] {
  const groups: Tile[][] = [];
  const size = grid.length;

  // горизонталь
  for (let y = 0; y < size; y++) {
    let run: Tile[] = [];

    for (let x = 0; x < size; x++) {
      const tile = grid[y][x];

      if (
        run.length === 0 ||
        (tile && run[0] && tile.type === run[0].type && !tile.isBomb)
      ) {
        if (tile) run.push(tile);
      } else {
        if (run.length >= 3) groups.push([...run]);
        run = tile ? [tile] : [];
      }
    }

    if (run.length >= 3) groups.push([...run]);
  }

  // вертикаль
  for (let x = 0; x < size; x++) {
    let run: Tile[] = [];

    for (let y = 0; y < size; y++) {
      const tile = grid[y][x];

      if (
        run.length === 0 ||
        (tile && run[0] && tile.type === run[0].type && !tile.isBomb)
      ) {
        if (tile) run.push(tile);
      } else {
        if (run.length >= 3) groups.push([...run]);
        run = tile ? [tile] : [];
      }
    }

    if (run.length >= 3) groups.push([...run]);
  }

  return groups;
}

export function uniqueTiles(groups: Tile[][]): Tile[] {
  const set = new Set<Tile>();

  groups.forEach(g => g.forEach(t => set.add(t)));

  return Array.from(set);
}