import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/appError.js';
import { verifySessionToken } from '../lib/jwt.js';
import { findUserById, type AppUser } from '../services/users.js';

export interface AuthenticatedRequest extends Request {
  user: AppUser;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError('Authorization token is missing', 401);
    }

    const token = authorization.replace('Bearer ', '').trim();
    const payload = verifySessionToken(token);
    const user = await findUserById(payload.sub);

    if (!user || user.telegramId !== payload.telegramId) {
      throw new AppError('User session is no longer valid', 401);
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    next(error);
  }
}
