import Phaser from 'phaser';
import { getPreloadedImage } from '../lib/assetPreloader';
import {
  BASE_SCROLL_SPEED,
  BOOST_JUMP_VELOCITY,
  COYOTE_TIME_MS,
  GRAVITY_Y,
  GROUND_Y,
  JUMP_BUFFER_MS,
  JUMP_VELOCITY,
  MAX_SCROLL_SPEED,
  OBSTACLE_MAX_SPAWN_MS,
  OBSTACLE_MIN_SPAWN_MS,
  PLAYER_X,
  RUNNER_END_EVENT,
  RUNNER_TAP_EVENT,
  RUNNER_HEIGHT,
  RUNNER_WIDTH,
  SCORE_PER_OBSTACLE,
  SCORE_PER_SECOND,
} from './config';
import type { RunnerCallbacks, RunnerObstacle, RunnerPattern, RunnerSpawnSpec } from './types';

const RUNNER_HERO_TEXTURE_KEY = 'runner-hero';
const RUNNER_HERO_ASSET_PATH = '/assets/runner_hero.png';
const RUNNER_BACKGROUND_TEXTURE_KEY = 'runner-background';
const RUNNER_BACKGROUND_ASSET_PATH = '/assets/runner_background.png';
const PLAYER_ORIGINAL_DISPLAY_HEIGHT = 92;
const PLAYER_DISPLAY_WIDTH = 91;
const PLAYER_DISPLAY_HEIGHT = 138;
const PLAYER_BASELINE_Y = GROUND_Y - 48 + (PLAYER_DISPLAY_HEIGHT - PLAYER_ORIGINAL_DISPLAY_HEIGHT) / 2;
const PLAYER_HITBOX_HEIGHT = 76;
const PLAYER_HITBOX_WIDTH = 30;
const PLAYER_HITBOX_OFFSET_X = 17;
const PLAYER_HITBOX_OFFSET_Y = 12;
const FLOOR_TOP = PLAYER_BASELINE_Y - PLAYER_DISPLAY_HEIGHT / 2 + PLAYER_HITBOX_OFFSET_Y + PLAYER_HITBOX_HEIGHT;
const FLOOR_HEIGHT = 18;
const RESTART_EVENT = 'runner:restart';
const LANDING_RESET_DELAY_MS = 120;
const SPAWN_X = RUNNER_WIDTH + 160;
const MIN_PATTERN_GAP = 420;
const DOUBLE_PATTERN_UNLOCK_SCORE = 700;
const COMBO_PATTERN_UNLOCK_SCORE = 2200;
const CHAIN_PATTERN_UNLOCK_SCORE = 5200;
const GAP_BY_TRANSITION = {
  single_single: 620,
  single_double: 860,
  double_single: 1220,
  double_double: 1320,
} as const;

export default class RunnerScene extends Phaser.Scene {
  private callbacks: RunnerCallbacks;

  private player!: Phaser.Physics.Arcade.Sprite;
  private background!: Phaser.GameObjects.TileSprite;
  private road!: Phaser.GameObjects.TileSprite;
  private floor!: Phaser.GameObjects.Rectangle;
  private obstacles!: Phaser.Physics.Arcade.Group;

  private spaceKey?: Phaser.Input.Keyboard.Key;

  private scrollSpeed = BASE_SCROLL_SPEED;
  private score = 0;
  private isGameOver = false;
  private airJumpAvailable = false;
  private lastGroundedAt = 0;
  private lastJumpPressedAt = Number.NEGATIVE_INFINITY;
  private lastJumpAt = Number.NEGATIVE_INFINITY;
  private nextPatternIndex = 0;
  private lastSpawnTailX = Number.NEGATIVE_INFINITY;
  private lastSpawnKind: RunnerSpawnSpec['kind'] | null = null;
  private runTimeMs = 0;

  constructor(callbacks: RunnerCallbacks) {
    super('RunnerScene');
    this.callbacks = callbacks;
  }

  preload(): void {
    this.addPreloadedHeroTexture();
    this.addPreloadedBackgroundTexture();
    this.createTextures();
  }

  private addPreloadedHeroTexture(): void {
    if (this.textures.exists(RUNNER_HERO_TEXTURE_KEY)) {
      return;
    }

    const preloadedHero = getPreloadedImage(RUNNER_HERO_ASSET_PATH);
    if (preloadedHero) {
      this.textures.addImage(RUNNER_HERO_TEXTURE_KEY, preloadedHero);
    }

    if (!this.textures.exists(RUNNER_HERO_TEXTURE_KEY)) {
      this.load.image(RUNNER_HERO_TEXTURE_KEY, RUNNER_HERO_ASSET_PATH);
    }
  }

  private addPreloadedBackgroundTexture(): void {
    if (this.textures.exists(RUNNER_BACKGROUND_TEXTURE_KEY)) {
      return;
    }

    const preloadedBackground = getPreloadedImage(RUNNER_BACKGROUND_ASSET_PATH);
    if (preloadedBackground) {
      this.textures.addImage(RUNNER_BACKGROUND_TEXTURE_KEY, preloadedBackground);
    }

    if (!this.textures.exists(RUNNER_BACKGROUND_TEXTURE_KEY)) {
      this.load.image(RUNNER_BACKGROUND_TEXTURE_KEY, RUNNER_BACKGROUND_ASSET_PATH);
    }
  }

  create(): void {
    this.physics.world.gravity.y = GRAVITY_Y;
    this.physics.world.setBounds(0, 0, RUNNER_WIDTH, RUNNER_HEIGHT);

    this.score = 0;
    this.scrollSpeed = BASE_SCROLL_SPEED;
    this.isGameOver = false;
    this.airJumpAvailable = false;
    this.lastGroundedAt = this.time.now;
    this.lastJumpPressedAt = Number.NEGATIVE_INFINITY;
    this.lastJumpAt = Number.NEGATIVE_INFINITY;
    this.nextPatternIndex = 0;
    this.lastSpawnTailX = Number.NEGATIVE_INFINITY;
    this.lastSpawnKind = null;
    this.runTimeMs = 0;
    this.callbacks.onScoreChange?.(0);
    this.callbacks.onGameOverChange?.(false);

    this.createWorld();
    this.createPlayer();
    this.createObstacles();
    this.createControls();
    this.scheduleObstacle();

    window.addEventListener(RESTART_EVENT, this.handleExternalRestart);
    window.addEventListener(RUNNER_END_EVENT, this.handleExternalEnd);
    window.addEventListener(RUNNER_TAP_EVENT, this.handleJumpInput);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.spaceKey?.off('down', this.handleJumpInput, this);
      window.removeEventListener(RESTART_EVENT, this.handleExternalRestart);
      window.removeEventListener(RUNNER_END_EVENT, this.handleExternalEnd);
      window.removeEventListener(RUNNER_TAP_EVENT, this.handleJumpInput);
    });
  }

  update(_: number, delta: number): void {
    if (this.isGameOver) {
      this.player.setVelocityX(0);
      return;
    }

    const deltaSeconds = delta / 1000;
    const now = this.time.now;
    const grounded = this.isGrounded();
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    this.runTimeMs += delta;
    this.scrollSpeed = this.getTargetScrollSpeed();
    this.score += deltaSeconds * SCORE_PER_SECOND * this.getSpeedScale();
    this.callbacks.onScoreChange?.(Math.floor(this.score));

    if (grounded && this.canResetJumpState(now, body)) {
      this.lastGroundedAt = now;
      this.airJumpAvailable = false;
    }

    if (this.shouldConsumeBufferedJump(now)) {
      this.performGroundJump();
    }

    this.advanceBackground(deltaSeconds);
    this.updatePlayerAnimation();
    this.cleanupObstacles();
  }

  private createTextures(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    if (!this.textures.exists('runner-obstacle-single')) {
      graphics.fillStyle(0x4c4a47, 1);
      graphics.fillRoundedRect(11, 12, 42, 84, 10);
      graphics.fillStyle(0x736d65, 1);
      graphics.fillRoundedRect(15, 16, 16, 76, 6);
      graphics.fillStyle(0x2c2b2b, 1);
      graphics.fillRect(5, 4, 54, 12);
      graphics.fillRect(4, 86, 56, 14);
      graphics.fillStyle(0x9a9184, 1);
      graphics.fillRect(17, 18, 8, 70);
      graphics.fillRect(36, 18, 6, 70);
      graphics.fillStyle(0x242323, 1);
      graphics.fillRect(11, 98, 42, 6);
      graphics.generateTexture('runner-obstacle-single', 64, 112);
      graphics.clear();
    }

    if (!this.textures.exists('runner-obstacle-double')) {
      graphics.fillStyle(0x3f3d3b, 1);
      graphics.fillRoundedRect(14, 16, 44, 160, 10);
      graphics.fillStyle(0x706a62, 1);
      graphics.fillRoundedRect(18, 22, 16, 148, 6);
      graphics.fillStyle(0x2b2a2a, 1);
      graphics.fillRect(6, 6, 60, 16);
      graphics.fillRect(5, 166, 62, 16);
      graphics.fillStyle(0x948b80, 1);
      graphics.fillRect(20, 26, 8, 138);
      graphics.fillRect(40, 26, 7, 138);
      graphics.fillStyle(0x242323, 1);
      graphics.fillRect(13, 182, 46, 8);
      graphics.generateTexture('runner-obstacle-double', 72, 198);
      graphics.clear();
    }

    if (!this.textures.exists('runner-road')) {
      graphics.fillStyle(0x312c2c, 1);
      graphics.fillRect(0, 0, 320, 92);
      graphics.fillStyle(0x4a4140, 1);
      graphics.fillRect(0, 0, 320, 10);
      graphics.fillStyle(0x1e1c1c, 1);
      graphics.fillRect(0, 72, 320, 20);
      graphics.fillStyle(0x514746, 0.55);
      for (let x = 0; x < 320; x += 46) {
        graphics.fillRect(x, 16, 24, 4);
        graphics.fillRect(x + 18, 42, 32, 4);
      }
      graphics.generateTexture('runner-road', 320, 92);
    }

    graphics.destroy();
  }

  private createWorld(): void {
    this.cameras.main.setBackgroundColor('#15100f');

    this.background = this.add.tileSprite(
      RUNNER_WIDTH / 2,
      RUNNER_HEIGHT / 2,
      RUNNER_WIDTH,
      RUNNER_HEIGHT,
      RUNNER_BACKGROUND_TEXTURE_KEY,
    );
    this.background.setDepth(0);
    this.background.setTileScale(RUNNER_HEIGHT / 724);
    this.background.tilePositionY = 0;

    this.road = this.add.tileSprite(RUNNER_WIDTH / 2, FLOOR_TOP + 30, RUNNER_WIDTH, 92, 'runner-road');
    this.road.setDepth(4);
    this.floor = this.add.rectangle(
      RUNNER_WIDTH / 2,
      FLOOR_TOP + FLOOR_HEIGHT / 2,
      RUNNER_WIDTH,
      FLOOR_HEIGHT,
      0x000000,
      0,
    );
    this.physics.add.existing(this.floor, true);
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(PLAYER_X, PLAYER_BASELINE_Y, 'runner-hero');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y * 0.08);
    this.player.setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
    this.player.setSize(
      PLAYER_HITBOX_WIDTH / this.player.scaleX,
      PLAYER_HITBOX_HEIGHT / this.player.scaleY,
    );
    this.player.setOffset(
      PLAYER_HITBOX_OFFSET_X / this.player.scaleX,
      PLAYER_HITBOX_OFFSET_Y / this.player.scaleY,
    );
    this.player.setDepth(10);
    this.player.setMaxVelocity(0, 1400);
    this.player.setDragX(0);
    this.physics.add.collider(this.player, this.floor);
  }

  private createObstacles(): void {
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, () => this.triggerGameOver());
  }

  private createControls(): void {
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey?.on('down', this.handleJumpInput, this);
  }

  private handleJumpInput = (): void => {
    if (this.isGameOver) {
      this.restartRun();
      return;
    }

    if (this.airJumpAvailable) {
      this.performAirJump();
      return;
    }

    const now = this.time.now;
    this.lastJumpPressedAt = now;

    if (this.shouldConsumeBufferedJump(now)) {
      this.performGroundJump();
    }
  };

  private isGrounded(): boolean {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  private shouldConsumeBufferedJump(now: number): boolean {
    const hasJumpBuffer = now - this.lastJumpPressedAt <= JUMP_BUFFER_MS;
    const canUseGroundJump = this.isGrounded() || now - this.lastGroundedAt <= COYOTE_TIME_MS;

    return !this.airJumpAvailable && hasJumpBuffer && canUseGroundJump;
  }

  private canResetJumpState(now: number, body: Phaser.Physics.Arcade.Body): boolean {
    return now - this.lastJumpAt > LANDING_RESET_DELAY_MS && body.velocity.y >= 0;
  }

  private performGroundJump(): void {
    this.player.setVelocityY(JUMP_VELOCITY);
    this.lastGroundedAt = Number.NEGATIVE_INFINITY;
    this.lastJumpPressedAt = Number.NEGATIVE_INFINITY;
    this.lastJumpAt = this.time.now;
    this.airJumpAvailable = true;
  }

  private performAirJump(): void {
    this.player.setVelocityY(BOOST_JUMP_VELOCITY);
    this.lastGroundedAt = Number.NEGATIVE_INFINITY;
    this.lastJumpPressedAt = Number.NEGATIVE_INFINITY;
    this.lastJumpAt = this.time.now;
    this.airJumpAvailable = false;
  }

  private getSpeedScale(): number {
    return this.scrollSpeed / BASE_SCROLL_SPEED;
  }

  private getDifficultyProgress(): number {
    const progress = this.runTimeMs / 140000;
    const eased = 1 - Math.pow(1 - Math.min(1, progress), 2.2);
    return eased;
  }

  private getTargetScrollSpeed(): number {
    return Phaser.Math.Linear(BASE_SCROLL_SPEED, MAX_SCROLL_SPEED, this.getDifficultyProgress());
  }

  private scheduleObstacle(): void {
    if (this.isGameOver) {
      return;
    }

    const pattern = this.pickPattern();
    const leadDistance = this.getLeadDistance(pattern);
    const delay = Phaser.Math.Clamp((leadDistance / this.scrollSpeed) * 1000, OBSTACLE_MIN_SPAWN_MS, OBSTACLE_MAX_SPAWN_MS);

    this.time.delayedCall(delay, () => {
      this.trySpawnPattern(pattern);
    });
  }

  private pickPattern(): RunnerPattern {
    const patterns: RunnerPattern[] = [
      {
        obstacles: [{ kind: 'single', offset: 0 }],
        minGap: 780,
      },
      {
        obstacles: [{ kind: 'single', offset: 0 }],
        minGap: 840,
      },
      {
        obstacles: [{ kind: 'double', offset: 0 }],
        minGap: 1040,
      },
      {
        obstacles: [
          { kind: 'single', offset: 0 },
          { kind: 'single', offset: 520 },
        ],
        minGap: 980,
      },
    ];

    if (this.score >= DOUBLE_PATTERN_UNLOCK_SCORE) {
      patterns.push({
        obstacles: [
          { kind: 'single' as const, offset: 0 },
          { kind: 'double' as const, offset: 560 },
        ],
        minGap: 1120,
      });
      patterns.push({
        obstacles: [
          { kind: 'single' as const, offset: 0 },
          { kind: 'single' as const, offset: 620 },
        ],
        minGap: 1080,
      });
    }

    if (this.score >= COMBO_PATTERN_UNLOCK_SCORE) {
      patterns.push({
        obstacles: [
          { kind: 'double' as const, offset: 0 },
          { kind: 'single' as const, offset: 860 },
        ],
        minGap: 1320,
      });
      patterns.push({
        obstacles: [
          { kind: 'single' as const, offset: 0 },
          { kind: 'double' as const, offset: 620 },
          { kind: 'single' as const, offset: 1240 },
        ],
        minGap: 1360,
      });
    }

    if (this.score >= CHAIN_PATTERN_UNLOCK_SCORE) {
      patterns.push({
        obstacles: [
          { kind: 'single' as const, offset: 0 },
          { kind: 'double' as const, offset: 660 },
          { kind: 'single' as const, offset: 1320 },
        ],
        minGap: 1480,
      });
      patterns.push({
        obstacles: [
          { kind: 'double' as const, offset: 0 },
          { kind: 'single' as const, offset: 920 },
          { kind: 'double' as const, offset: 1600 },
        ],
        minGap: 1680,
      });
    }

    const availablePatterns =
      this.lastSpawnKind === 'double'
        ? patterns.filter((pattern) => pattern.obstacles[0]?.kind !== 'double')
        : patterns;

    const sourcePatterns = availablePatterns.length > 0 ? availablePatterns : patterns;
    const pattern = sourcePatterns[this.nextPatternIndex % sourcePatterns.length];
    this.nextPatternIndex += Phaser.Math.Between(1, 3);
    return pattern;
  }

  private getLeadDistance(pattern: RunnerPattern): number {
    const speedScale = this.getSpeedScale();
    const difficulty = this.getDifficultyProgress();
    const baseLead = Phaser.Math.Linear(1080, 760, difficulty);
    const patternLength = pattern.obstacles[pattern.obstacles.length - 1]?.offset ?? 0;
    const difficultyPadding = pattern.obstacles.some((spec) => spec.kind === 'double') ? 220 : 120;
    const transitionGap = this.getRequiredGapForPattern(pattern);

    return (
      baseLead +
      patternLength +
      difficultyPadding +
      pattern.minGap * 0.28 +
      transitionGap * 0.52
    ) / Math.max(0.92, speedScale * 0.9);
  }

  private trySpawnPattern(pattern: RunnerPattern, attempt = 0): void {
    if (this.isGameOver) {
      return;
    }

    if (!this.canSpawnPatternNow(pattern) && attempt < 10) {
      this.time.delayedCall(180, () => this.trySpawnPattern(pattern, attempt + 1));
      return;
    }

    this.spawnPattern(pattern);
    this.scheduleObstacle();
  }

  private canSpawnPatternNow(pattern: RunnerPattern): boolean {
    const rightmostObstacleEdge = this.getRightmostObstacleEdge();
    if (rightmostObstacleEdge === Number.NEGATIVE_INFINITY) {
      return true;
    }

    return SPAWN_X - rightmostObstacleEdge >= this.getRequiredGapForPattern(pattern);
  }

  private getRequiredGapForPattern(pattern: RunnerPattern): number {
    const firstKind = pattern.obstacles[0]?.kind ?? 'single';
    const contextualGap = this.getScaledContextualGap(this.lastSpawnKind, firstKind);
    return Math.max(MIN_PATTERN_GAP, pattern.minGap, contextualGap);
  }

  private getContextualGap(
    previousKind: RunnerSpawnSpec['kind'] | null,
    nextKind: RunnerSpawnSpec['kind'],
  ): number {
    if (!previousKind) {
      return MIN_PATTERN_GAP;
    }

    const key = `${previousKind}_${nextKind}` as keyof typeof GAP_BY_TRANSITION;
    return GAP_BY_TRANSITION[key];
  }

  private getScaledContextualGap(
    previousKind: RunnerSpawnSpec['kind'] | null,
    nextKind: RunnerSpawnSpec['kind'],
  ): number {
    const baseGap = this.getContextualGap(previousKind, nextKind);
    const speedProgress = Phaser.Math.Clamp((this.getSpeedScale() - 1) / 2, 0, 1);
    const multiplier =
      previousKind === 'double' && nextKind === 'double'
        ? Phaser.Math.Linear(1, 1.7, speedProgress)
        : Phaser.Math.Linear(1, 1.28, speedProgress);

    return Math.round(baseGap * multiplier * 1.1);
  }

  private getRightmostObstacleEdge(): number {
    let rightmost = Number.NEGATIVE_INFINITY;

    this.obstacles.getChildren().forEach((child) => {
      const obstacle = child as RunnerObstacle;
      if (!obstacle.active) {
        return;
      }

      rightmost = Math.max(rightmost, obstacle.x + obstacle.displayWidth / 2);
    });

    return Math.max(rightmost, this.lastSpawnTailX);
  }

  private spawnPattern(pattern: RunnerPattern): void {
    if (this.isGameOver) {
      return;
    }

    let tailX = Number.NEGATIVE_INFINITY;

    pattern.obstacles.forEach((spec) => {
      const obstacle = this.spawnObstacle(spec, SPAWN_X + spec.offset);
      tailX = Math.max(tailX, obstacle.x + obstacle.displayWidth / 2);
    });

    this.lastSpawnTailX = tailX;
    this.lastSpawnKind = pattern.obstacles[pattern.obstacles.length - 1]?.kind ?? this.lastSpawnKind;
  }

  private spawnObstacle(spec: RunnerSpawnSpec, spawnX: number): RunnerObstacle {
    const isDouble = spec.kind === 'double';
    const width = isDouble ? Phaser.Math.Between(72, 88) : Phaser.Math.Between(50, 66);
    const height = isDouble ? Phaser.Math.Between(278, 316) : Phaser.Math.Between(118, 156);
    const texture = isDouble ? 'runner-obstacle-double' : 'runner-obstacle-single';
    const obstacle = this.obstacles.create(
      spawnX + width,
      FLOOR_TOP - height / 2,
      texture,
    ) as RunnerObstacle;

    obstacle.setDisplaySize(width, height);
    obstacle.kind = spec.kind;
    obstacle.setImmovable(true);
    const body = obstacle.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.allowGravity = false;
      body.setSize(width * (isDouble ? 0.6 : 0.7), height * 0.94);
      body.setOffset((width - body.width) / 2, height - body.height);
    }
    obstacle.setVelocityX(-this.scrollSpeed);
    obstacle.setDepth(9);
    return obstacle;
  }

  private cleanupObstacles(): void {
    this.obstacles.getChildren().forEach((child) => {
      const obstacle = child as RunnerObstacle;

      obstacle.setVelocityX(-this.scrollSpeed);

      if (!obstacle.passed && obstacle.x < PLAYER_X - 28) {
        obstacle.passed = true;
        this.score += SCORE_PER_OBSTACLE;
        this.callbacks.onScoreChange?.(Math.floor(this.score));
      }

      if (obstacle.x < -80) {
        obstacle.destroy();
      }
    });

    if (this.obstacles.countActive(true) === 0) {
      this.lastSpawnTailX = Number.NEGATIVE_INFINITY;
      this.lastSpawnKind = null;
    }
  }

  private updatePlayerAnimation(): void {
    this.player.setAngle(0);
  }

  private advanceBackground(deltaSeconds: number): void {
    this.background.tilePositionX += this.scrollSpeed * deltaSeconds * 0.22;
    this.road.tilePositionX += this.scrollSpeed * deltaSeconds;
  }

  private triggerGameOver(): void {
    if (this.isGameOver) {
      return;
    }

    this.isGameOver = true;
    this.callbacks.onGameOverChange?.(true);
    this.player.setTint(0xffc3a0);
    this.player.setAngle(90);
    this.player.setVelocity(0, -120);
    this.physics.pause();
  }

  private restartRun(): void {
    this.scene.restart();
  }

  private handleExternalRestart = (): void => {
    this.restartRun();
  };

  private handleExternalEnd = (): void => {
    this.triggerGameOver();
  };
}
