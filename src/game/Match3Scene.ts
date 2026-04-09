import Phaser from "phaser";
import { GEM_ASSET_COUNT, GRID_SIZE, TILE_SIZE, OFFSET_X, OFFSET_Y, TILE_TYPES } from "./config";

import type { Grid, Tile } from "./types";

import { findMatchGroups, uniqueTiles } from "./match";
import { collectExplosion } from "./bombs";
import { collapse } from "./gravity";
import { refill } from "./refill";
import type { GameCallbacks } from "./GameManager";

export default class Match3Scene extends Phaser.Scene {
  private grid: Grid = [];
  private selected: Tile | null = null;
  private busy = false;
  private activeGemAssets: number[] = [];

  private callbacks: GameCallbacks;
  private score = 0;

  constructor(callbacks: GameCallbacks) {
    super("Match3Scene");
    this.callbacks = callbacks;
  }

  preload(): void {
    for (let i = 0; i < GEM_ASSET_COUNT; i++) {
      this.load.image(`gem${i}`, `/assets/gem${i}.png`);
    }

    this.load.image("gem_bomb", "/assets/gem_bomb.png");
  }

  create(): void {
    this.activeGemAssets = this.pickActiveGemAssets();
    this.createBoard();
    this.time.delayedCall(50, () => this.resolve());
    this.input.on("gameobjectdown", this.handleClick, this);
  }

  private pickActiveGemAssets(): number[] {
    const allAssets = Array.from({ length: GEM_ASSET_COUNT }, (_, index) => index);
    return Phaser.Utils.Array.Shuffle(allAssets).slice(0, TILE_TYPES);
  }

  private createBoard(): void {
    this.grid = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      const row: (Tile | null)[] = [];

      for (let x = 0; x < GRID_SIZE; x++) {
        const type = Phaser.Math.Between(0, TILE_TYPES - 1);
        row.push(this.createTile(x, y, type, y));
      }

      this.grid.push(row);
    }
  }

  private createTile(
    x: number,
    y: number,
    type: number | "bomb",
    spawnY: number,
  ): Tile {
    const texture =
      type === "bomb"
        ? "gem_bomb"
        : `gem${this.activeGemAssets[type] ?? type}`;

    const sprite = this.add.image(
      OFFSET_X + x * TILE_SIZE + TILE_SIZE / 2,
      OFFSET_Y + spawnY * TILE_SIZE + TILE_SIZE / 2,
      texture,
    );

    sprite.setDisplaySize(TILE_SIZE - 4, TILE_SIZE - 4);
    sprite.setInteractive();

    const tile: Tile = {
      x,
      y,
      type,
      isBomb: type === "bomb",
      sprite,
    };

    (sprite as Phaser.GameObjects.Image & { tile?: Tile }).tile = tile;

    return tile;
  }

  private handleClick(
    _: Phaser.Input.Pointer,
    obj: Phaser.GameObjects.GameObject,
  ): void {
    if (this.busy) return;

    const tile = (obj as Phaser.GameObjects.Image & { tile?: Tile }).tile;
    if (!tile) return;

    // повторный клик отмена выделения
    if (this.selected === tile) {
      this.selected = null;
      this.clearHighlight();
      return;
    }

    if (!this.selected) {
      this.selected = tile;
      this.highlight(tile);
      return;
    }

    if (!this.areNeighbors(this.selected, tile)) {
      this.selected = tile;
      this.highlight(tile);
      return;
    }

    const first = this.selected;
    this.clearHighlight();
    this.selected = null;

    this.swap(first, tile);
  }

  private areNeighbors(a: Tile, b: Tile): boolean {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  }

  private selectedSprite: Phaser.GameObjects.Rectangle | null = null;

  private highlight(tile: Tile): void {
    if (this.selectedSprite) {
      this.selectedSprite.destroy();
    }

    this.selectedSprite = this.add.rectangle(
      tile.sprite.x,
      tile.sprite.y,
      TILE_SIZE,
      TILE_SIZE,
    );

    this.selectedSprite.setStrokeStyle(3, 0xffffff);
  }

  private clearHighlight(): void {
    this.selectedSprite?.destroy();
    this.selectedSprite = null;
  }

  private swap(a: Tile, b: Tile): void {
    this.busy = true;

    this.animateSwap(a, b, () => {
      this.swapTiles(a, b);

      if (a.isBomb || b.isBomb) {
        const bombs = [a, b].filter((tile) => tile.isBomb);
        this.remove(bombs, null, () => this.settleBoard());
        return;
      }

      const groups = findMatchGroups(this.grid);
      const matches = uniqueTiles(groups);

      if (matches.length === 0) {
        this.animateSwap(a, b, () => {
          this.swapTiles(a, b);
          this.busy = false;
        });
        return;
      }

      this.resolve();
    });
  }

  private settleBoard(): void {
    const moved = collapse(this.grid);

    this.animateFall(moved, () => {
      const created = refill(this, this.grid, this.createTile.bind(this));

      this.animateFall(created, () => {
        this.time.delayedCall(50, () => this.resolve());
      });
    });
  }

  private swapTiles(a: Tile, b: Tile): void {
    this.grid[a.y][a.x] = b;
    this.grid[b.y][b.x] = a;

    const ax = a.x;
    const ay = a.y;

    a.x = b.x;
    a.y = b.y;

    b.x = ax;
    b.y = ay;
  }

  private animateSwap(a: Tile, b: Tile, onComplete: () => void): void {
    const ax = a.sprite.x;
    const ay = a.sprite.y;
    const bx = b.sprite.x;
    const by = b.sprite.y;

    let done = 0;

    const cb = () => {
      done++;
      if (done === 2) onComplete();
    };

    this.tweens.add({
      targets: a.sprite,
      x: bx,
      y: by,
      duration: 120,
      onComplete: cb,
    });

    this.tweens.add({
      targets: b.sprite,
      x: ax,
      y: ay,
      duration: 120,
      onComplete: cb,
    });
  }

  private resolve(): void {
    const groups = findMatchGroups(this.grid);
    const matches = uniqueTiles(groups);

    if (matches.length === 0) {
      this.busy = false;
      return;
    }

    const bombSpawn = this.getBombSpawn(groups);

    this.addScore(matches.length * 10);

    this.remove(matches, bombSpawn, () => {
      this.settleBoard();
    });

    // this.drawDebug();
  }

  private addScore(points: number): void {
    this.score += points;
    this.callbacks.onScoreChange?.(this.score);
  }

  private getBombSpawn(groups: Tile[][]): { x: number; y: number } | null {
    const big = groups.filter((g) => g.length >= 4);
    if (big.length === 0) return null;

    const g = big[0];
    const t = g[Math.floor(g.length / 2)];

    return { x: t.x, y: t.y };
  }

  private remove(
    tiles: Tile[],
    bombSpawn: { x: number; y: number } | null,
    onComplete: () => void,
  ): void {
    const spawnTile =
      bombSpawn && this.grid[bombSpawn.y]
        ? this.grid[bombSpawn.y][bombSpawn.x]
        : null;

    let targets = tiles.filter((t) => t !== spawnTile);

    const bombs = tiles.filter((t) => t.isBomb);

    if (bombs.length > 0) {
      targets = collectExplosion(this.grid, bombs);
    }

    if (targets.length === 0) {
      if (spawnTile) this.spawnBomb(spawnTile);
      onComplete();
      return;
    }

    let done = 0;

    targets.forEach((tile) => {
      this.tweens.add({
        targets: tile.sprite,
        scale: 0,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          if (this.grid[tile.y][tile.x] === tile) {
            this.grid[tile.y][tile.x] = null;
          }

          tile.sprite.destroy();

          done++;

          if (done === targets.length) {
            if (spawnTile) this.spawnBomb(spawnTile);
            onComplete();
          }
        },
      });
    });
  }

  private spawnBomb(tile: Tile): void {
    const { x, y } = tile;

    tile.sprite.destroy();

    const newTile = this.createTile(x, y, "bomb", y);
    const targetScaleX = newTile.sprite.scaleX;
    const targetScaleY = newTile.sprite.scaleY;

    newTile.sprite.setScale(targetScaleX * 0.4, targetScaleY * 0.4);
    newTile.sprite.setAlpha(0);
    newTile.sprite.setAngle(-8);

    this.grid[y][x] = newTile;

    this.tweens.add({
      targets: newTile.sprite,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      alpha: 1,
      angle: 0,
      duration: 320,
      ease: "Back.Out",
      onComplete: () => {
        this.tweens.add({
          targets: newTile.sprite,
          angle: 6,
          duration: 45,
          ease: "Sine.InOut",
          yoyo: true,
          repeat: 5,
        });

        this.tweens.add({
          targets: newTile.sprite,
          scaleX: targetScaleX * 1.08,
          scaleY: targetScaleY * 1.08,
          duration: 90,
          ease: "Quad.Out",
          yoyo: true,
          repeat: 1,
        });
      },
    });
  }

  private animateFall(tiles: Tile[], onComplete: () => void): void {
    if (tiles.length === 0) {
      onComplete();
      return;
    }

    let done = 0;

    tiles.forEach((tile) => {
      this.tweens.add({
        targets: tile.sprite,
        x: OFFSET_X + tile.x * TILE_SIZE + TILE_SIZE / 2,
        y: OFFSET_Y + tile.y * TILE_SIZE + TILE_SIZE / 2,
        duration: 200,
        onComplete: () => {
          done++;
          if (done === tiles.length) onComplete();
        },
      });
    });
  }

  // private debugText: Phaser.GameObjects.Text[] = [];

  // private drawDebug(): void {
  //   this.debugText.forEach((t) => t.destroy());
  //   this.debugText = [];

  //   for (let y = 0; y < this.grid.length; y++) {
  //     for (let x = 0; x < this.grid[y].length; x++) {
  //       const tile = this.grid[y][x];
  //       if (!tile) continue;

  //       const txt = this.add.text(
  //         tile.sprite.x - 14,
  //         tile.sprite.y - 10,
  //         `${x},${y}`,
  //         { fontSize: "10px", color: "#ff0000" },
  //       );

  //       this.debugText.push(txt);
  //     }
  //   }
  // }
}
