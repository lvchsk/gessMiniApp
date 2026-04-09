import Phaser from 'phaser';
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
  RUNNER_HEIGHT,
  RUNNER_WIDTH,
  SCORE_PER_OBSTACLE,
  SCORE_PER_SECOND,
} from './config';
import type { RunnerCallbacks, RunnerObstacle, RunnerPattern, RunnerSpawnSpec } from './types';

const PLAYER_BASELINE_Y = GROUND_Y - 48;
const PLAYER_HITBOX_HEIGHT = 76;
const PLAYER_HITBOX_OFFSET_Y = 12;
const PLAYER_TEXTURE_HEIGHT = 92;
const FLOOR_TOP = PLAYER_BASELINE_Y - PLAYER_TEXTURE_HEIGHT / 2 + PLAYER_HITBOX_OFFSET_Y + PLAYER_HITBOX_HEIGHT;
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
  private ground!: Phaser.GameObjects.TileSprite;
  private floor!: Phaser.GameObjects.Rectangle;
  private skyline!: Phaser.GameObjects.TileSprite;
  private cloudFar!: Phaser.GameObjects.TileSprite;
  private cloudNear!: Phaser.GameObjects.TileSprite;
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
    this.createTextures();
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.spaceKey?.off('down', this.handleJumpInput, this);
      this.input.off('pointerdown', this.handleJumpInput, this);
      window.removeEventListener(RESTART_EVENT, this.handleExternalRestart);
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
    if (this.textures.exists('runner-player')) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x6a3210, 1);
    graphics.fillRoundedRect(18, 8, 28, 54, 10);
    graphics.fillStyle(0xf4d8bf, 1);
    graphics.fillCircle(32, 14, 12);
    graphics.fillStyle(0x2d1407, 1);
    graphics.fillRect(18, 60, 8, 24);
    graphics.fillRect(38, 60, 8, 24);
    graphics.fillRect(12, 24, 10, 26);
    graphics.fillRect(42, 24, 10, 26);
    graphics.generateTexture('runner-player', 64, 92);
    graphics.clear();

    graphics.fillStyle(0x734117, 1);
    graphics.fillRoundedRect(8, 8, 54, 90, 18);
    graphics.fillStyle(0x492105, 1);
    graphics.fillRect(0, 58, 64, 12);
    graphics.fillRect(0, 84, 64, 14);
    graphics.generateTexture('runner-obstacle-single', 64, 100);
    graphics.clear();

    graphics.fillStyle(0x6d2f18, 1);
    graphics.fillRoundedRect(14, 20, 44, 132, 18);
    graphics.fillStyle(0xb73e1f, 1);
    graphics.fillRoundedRect(18, 26, 36, 108, 14);
    graphics.fillStyle(0xffd26f, 1);
    graphics.fillRect(10, 12, 52, 10);
    graphics.fillRect(10, 146, 52, 8);
    graphics.fillStyle(0xfff1b8, 1);
    graphics.fillRect(18, 42, 36, 8);
    graphics.fillRect(18, 68, 36, 8);
    graphics.fillRect(18, 94, 36, 8);
    graphics.fillRect(18, 120, 36, 8);
    graphics.generateTexture('runner-obstacle-double', 72, 160);
    graphics.clear();

    graphics.fillStyle(0xf5d59c, 1);
    graphics.fillRect(0, 0, 256, 64);
    graphics.fillStyle(0xe1ae61, 1);
    graphics.fillRect(0, 44, 256, 20);
    graphics.fillStyle(0xc47a33, 1);
    graphics.fillRect(0, 50, 256, 14);
    graphics.generateTexture('runner-ground', 256, 64);
    graphics.clear();

    graphics.fillStyle(0xffefcf, 1);
    graphics.fillEllipse(70, 36, 92, 34);
    graphics.fillEllipse(118, 30, 92, 42);
    graphics.fillEllipse(160, 36, 82, 30);
    graphics.generateTexture('runner-cloud', 220, 76);
    graphics.clear();

    graphics.fillStyle(0xd28d46, 1);
    graphics.fillTriangle(0, 130, 70, 28, 140, 130);
    graphics.fillTriangle(100, 130, 190, 42, 280, 130);
    graphics.generateTexture('runner-hills', 280, 140);
    graphics.destroy();
  }

  private createWorld(): void {
    this.cameras.main.setBackgroundColor('#f5c888');

    this.add.rectangle(RUNNER_WIDTH / 2, RUNNER_HEIGHT / 2, RUNNER_WIDTH, RUNNER_HEIGHT, 0xf7ca87);
    this.add.rectangle(RUNNER_WIDTH / 2, RUNNER_HEIGHT * 0.58, RUNNER_WIDTH, RUNNER_HEIGHT * 0.65, 0xf0be73, 0.28);

    this.cloudFar = this.add.tileSprite(RUNNER_WIDTH / 2, 160, RUNNER_WIDTH, 120, 'runner-cloud');
    this.cloudFar.setAlpha(0.24);

    this.cloudNear = this.add.tileSprite(RUNNER_WIDTH / 2, 210, RUNNER_WIDTH, 140, 'runner-cloud');
    this.cloudNear.setAlpha(0.4);

    this.skyline = this.add.tileSprite(RUNNER_WIDTH / 2, GROUND_Y - 60, RUNNER_WIDTH, 140, 'runner-hills');
    this.skyline.setAlpha(0.68);

    this.ground = this.add.tileSprite(RUNNER_WIDTH / 2, GROUND_Y + 32, RUNNER_WIDTH, 64, 'runner-ground');
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
    this.player = this.physics.add.sprite(PLAYER_X, PLAYER_BASELINE_Y, 'runner-player');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(GRAVITY_Y * 0.08);
    this.player.setSize(30, PLAYER_HITBOX_HEIGHT);
    this.player.setOffset(17, PLAYER_HITBOX_OFFSET_Y);
    this.player.setDepth(10);
    this.player.setMaxVelocity(0, 1400);
    this.player.setDragX(0);
    this.player.setScale(1);
    this.physics.add.collider(this.player, this.floor);
  }

  private createObstacles(): void {
    this.obstacles = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacles, () => this.triggerGameOver());
  }

  private createControls(): void {
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey?.on('down', this.handleJumpInput, this);
    this.input.on('pointerdown', this.handleJumpInput, this);
  }

  private handleJumpInput(): void {
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
  }

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
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speedScale = this.getSpeedScale();

    if (!this.isGrounded()) {
      this.player.setAngle(Phaser.Math.Clamp(body.velocity.y * 0.02, -14, 18));
      this.player.setScale(1);
      return;
    }

    const runWave = Math.sin(this.time.now * 0.012 * speedScale);
    this.player.setAngle(runWave * 3.5);
    this.player.setScale(1);
  }

  private advanceBackground(deltaSeconds: number): void {
    this.cloudFar.tilePositionX += this.scrollSpeed * deltaSeconds * 0.08;
    this.cloudNear.tilePositionX += this.scrollSpeed * deltaSeconds * 0.16;
    this.skyline.tilePositionX += this.scrollSpeed * deltaSeconds * 0.38;
    this.ground.tilePositionX += this.scrollSpeed * deltaSeconds;
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
}
