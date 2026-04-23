import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import leaderboardRoutes from './routes/leaderboards.js';
import scoreRoutes from './routes/scores.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origin is not allowed by CORS'));
      },
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(express.json({ limit: '16kb' }));

  app.get('/', (_req, res) => {
    res.status(200).json({
      ok: true,
      message: 'Gess Mini App backend is running',
    });
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/scores', scoreRoutes);
  app.use('/api/leaderboards', leaderboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
