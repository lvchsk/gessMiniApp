import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/appError.js';
import { signScoreSessionToken, verifyScoreSessionToken } from '../lib/jwt.js';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/auth.js';
import { serializeUser, updateHighScore, type ScoreGame } from '../services/users.js';

const router = Router();

const scoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

const SCORE_LIMITS_BY_GAME = {
  runner: {
    graceScore: 200,
    maxScorePerSecond: 40,
  },
  match: {
    graceScore: 300,
    maxScorePerSecond: 90,
  },
} as const satisfies Record<ScoreGame, { graceScore: number; maxScorePerSecond: number }>;

function parseGame(value: string): ScoreGame {
  if (value === 'runner' || value === 'match') {
    return value;
  }

  throw new AppError('Game must be either runner or match', 400);
}

function assertScoreSessionIsValid(
  authReq: AuthenticatedRequest,
  game: ScoreGame,
  score: number,
  scoreToken: string,
): void {
  const scoreSession = verifyScoreSessionToken(scoreToken);

  if (
    scoreSession.sub !== String(authReq.user._id) ||
    scoreSession.telegramId !== authReq.user.telegramId ||
    scoreSession.game !== game
  ) {
    throw new AppError('Score session does not match current user or game', 401);
  }

  const elapsedMs = Date.now() - scoreSession.startedAt;

  if (!Number.isFinite(elapsedMs) || elapsedMs < -5000) {
    throw new AppError('Score session start time is invalid', 401);
  }

  const elapsedSeconds = Math.max(1, Math.ceil(elapsedMs / 1000));
  const limits = SCORE_LIMITS_BY_GAME[game];
  const maxAllowedScore = limits.graceScore + elapsedSeconds * limits.maxScorePerSecond;

  if (score > maxAllowedScore) {
    throw new AppError('Score is too high for this game session', 400);
  }
}

router.post(
  '/:game/session',
  scoreLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const rawGame = Array.isArray(req.params.game) ? req.params.game[0] : req.params.game;
    const game = parseGame(rawGame);
    const scoreToken = signScoreSessionToken(String(authReq.user._id), authReq.user.telegramId, game);

    res.status(200).json({
      game,
      scoreToken,
    });
  }),
);

router.post(
  '/:game',
  scoreLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const rawGame = Array.isArray(req.params.game) ? req.params.game[0] : req.params.game;
    const game = parseGame(rawGame);
    const score = Number(req.body?.score);
    const scoreToken = typeof req.body?.scoreToken === 'string' ? req.body.scoreToken : '';

    if (!Number.isInteger(score) || score < 0) {
      throw new AppError('Score must be a non-negative integer', 400);
    }

    if (!scoreToken) {
      throw new AppError('Score session token is required', 400);
    }

    assertScoreSessionIsValid(authReq, game, score, scoreToken);

    const result = await updateHighScore(String(authReq.user._id), game, score);

    if (!result || !result.user) {
      throw new AppError('User was not found', 404);
    }

    res.status(200).json({
      game,
      updated: result.updated,
      previousBest: result.previousBest,
      bestScore: result.bestScore,
      user: serializeUser(result.user),
    });
  }),
);

export default router;
