import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/appError.js';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/auth.js';
import { serializeUser, updateHighScore, type ScoreGame } from '../services/users.js';

const router = Router();

const scoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

function parseGame(value: string): ScoreGame {
  if (value === 'runner' || value === 'match') {
    return value;
  }

  throw new AppError('Game must be either runner or match', 400);
}

router.post(
  '/:game',
  scoreLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const rawGame = Array.isArray(req.params.game) ? req.params.game[0] : req.params.game;
    const game = parseGame(rawGame);
    const score = Number(req.body?.score);

    if (!Number.isInteger(score) || score < 0) {
      throw new AppError('Score must be a non-negative integer', 400);
    }

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
