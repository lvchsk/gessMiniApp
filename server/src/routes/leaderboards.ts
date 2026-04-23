import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/appError.js';
import { getLeaderboard, type ScoreGame } from '../services/users.js';

const router = Router();

function parseGame(value: string): ScoreGame {
  if (value === 'runner' || value === 'match') {
    return value;
  }

  throw new AppError('Game must be either runner or match', 400);
}

router.get(
  '/:game',
  asyncHandler(async (req, res) => {
    const rawGame = Array.isArray(req.params.game) ? req.params.game[0] : req.params.game;
    const game = parseGame(rawGame);
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new AppError('limit must be a positive integer', 400);
    }

    const items = await getLeaderboard(game, limit);

    res.status(200).json({
      game,
      total: items.length,
      items,
    });
  }),
);

export default router;
