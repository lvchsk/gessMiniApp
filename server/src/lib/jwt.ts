import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './appError.js';

interface SessionPayload {
  sub: string;
  telegramId: number;
}

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
