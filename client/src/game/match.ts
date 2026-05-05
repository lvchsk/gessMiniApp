import type { Grid, Tile } from './types';

export function findMatchGroups(grid: Grid): Tile[][] {
  const groups: Tile[][] = [];
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;

  // горизонталь
  for (let y = 0; y < rows; y++) {
    let run: Tile[] = [];

    for (let x = 0; x < columns; x++) {
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
  for (let x = 0; x < columns; x++) {
    let run: Tile[] = [];

    for (let y = 0; y < rows; y++) {
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
