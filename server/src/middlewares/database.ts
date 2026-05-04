import type { NextFunction, Request, Response } from 'express';
import { connectToDatabase } from '../config/database.js';

function shouldSkipDatabaseConnection(path: string): boolean {
  return path === '/' || path.startsWith('/api/health');
}

export async function ensureDatabaseConnection(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (shouldSkipDatabaseConnection(req.path)) {
      next();
      return;
    }

    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
}
