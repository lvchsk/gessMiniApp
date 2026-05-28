import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './appError.js';

interface SessionPayload {
  sub: string;
  telegramId: number;
}

interface ScoreSessionPayload extends SessionPayload {
  game: 'runner' | 'match';
  startedAt: number;
}

const SCORE_SESSION_TOKEN_TYPE = 'score-session';
const SCORE_SESSION_EXPIRES_IN = '6h';

export function signSessionToken(userId: string, telegramId: number): string {
  const signOptions: SignOptions = {
    subject: userId,
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(
    {
      telegramId,
    },
    env.jwtSecret,
    signOptions,
  );
}

export function verifySessionToken(token: string): SessionPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded !== 'object' || !decoded.sub || typeof decoded.telegramId !== 'number') {
      throw new AppError('Invalid session token payload', 401);
    }

    return {
      sub: decoded.sub,
      telegramId: decoded.telegramId,
    };
  } catch {
    throw new AppError('Invalid or expired session token', 401);
  }
}

export function signScoreSessionToken(
  userId: string,
  telegramId: number,
  game: ScoreSessionPayload['game'],
): string {
  const signOptions: SignOptions = {
    subject: userId,
    expiresIn: SCORE_SESSION_EXPIRES_IN,
  };

  return jwt.sign(
    {
      telegramId,
      game,
      startedAt: Date.now(),
      type: SCORE_SESSION_TOKEN_TYPE,
    },
    env.jwtSecret,
    signOptions,
  );
}

export function verifyScoreSessionToken(token: string): ScoreSessionPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (
      typeof decoded !== 'object' ||
      !decoded.sub ||
      typeof decoded.telegramId !== 'number' ||
      decoded.type !== SCORE_SESSION_TOKEN_TYPE ||
      (decoded.game !== 'runner' && decoded.game !== 'match') ||
      typeof decoded.startedAt !== 'number'
    ) {
      throw new AppError('Invalid score session token payload', 401);
    }

    return {
      sub: decoded.sub,
      telegramId: decoded.telegramId,
      game: decoded.game,
      startedAt: decoded.startedAt,
    };
  } catch {
    throw new AppError('Invalid or expired score session token', 401);
  }
}
