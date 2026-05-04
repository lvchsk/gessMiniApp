import 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getApp } from './lib/expressApp.js';
import { connectToDatabase } from './config/database.js';

const app = getApp();

function shouldConnectToDatabase(url: string): boolean {
  return url !== '/' && !url.startsWith('/api/health');
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = req.url ?? '/';

    if (shouldConnectToDatabase(url)) {
      await connectToDatabase();
    }

    return app(req, res);
  } catch (error) {
    console.error('Failed to initialize serverless request', error);

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          error: 'Server initialization failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}
