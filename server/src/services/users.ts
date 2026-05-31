import type { HydratedDocument } from 'mongoose';
import { UserModel, type UserDocument } from '../models/User.js';

export type AppUser = HydratedDocument<UserDocument>;
export type ScoreGame = 'runner' | 'match';

// жопа)
// popa)
// jopa

const SCORE_FIELD_BY_GAME = {
  runner: 'scoreRunner',
  match: 'scoreMatch',
} as const satisfies Record<ScoreGame, keyof UserDocument>;

export function serializeUser(user: AppUser) {
  return {
    telegramId: user.telegramId,
    username: user.username,
    registrationDate: user.registrationDate,
    scoreRunner: user.scoreRunner,
    scoreMatch: user.scoreMatch,
  };
}

export async function findOrCreateUser(telegramId: number, username: string): Promise<AppUser> {
  const user = await UserModel.findOneAndUpdate(
    { telegramId },
    {
      $setOnInsert: {
        telegramId,
      },
      $set: {
        username,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return user;
}

export async function findUserById(userId: string): Promise<AppUser | null> {
  return UserModel.findById(userId);
}

export async function updateHighScore(userId: string, game: ScoreGame, score: number) {
  const field = SCORE_FIELD_BY_GAME[game];
  const currentUser = await UserModel.findById(userId);

  if (!currentUser) {
    return null;
  }

  const previousBest = currentUser[field];

  if (score <= previousBest) {
    return {
      updated: false,
      previousBest,
      bestScore: previousBest,
      user: currentUser,
    };
  }

  const updatedUser = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      [field]: { $lt: score },
    },
    {
      $set: {
        [field]: score,
      },
    },
    {
      new: true,
    },
  );

  const user = updatedUser ?? (await UserModel.findById(userId));

  return {
    updated: Boolean(updatedUser),
    previousBest,
    bestScore: user?.[field] ?? previousBest,
    user,
  };
}

export async function getLeaderboard(game: ScoreGame, limit: number) {
  const field = SCORE_FIELD_BY_GAME[game];
  const maxLimit = game === 'runner' ? 500 : 100;
  const safeLimit = Math.min(Math.max(limit, 1), maxLimit);

  const users = await UserModel.find({})
    .sort({ [field]: -1, telegramId: 1 })
    .limit(safeLimit)
    .select({
      username: 1,
      registrationDate: 1,
      [field]: 1,
      _id: 0,
    })
    .lean();

  return users.map((user, index) => ({
    rank: index + 1,
    username: user.username,
    registrationDate: user.registrationDate,
    score: Number(user[field] ?? 0),
  }));
}
