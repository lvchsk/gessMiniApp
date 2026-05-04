import dotenv from 'dotenv';

dotenv.config();

export interface Env {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  mongodbDbName: string;
  telegramBotToken: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  telegramInitDataMaxAgeSeconds: number;
  corsOrigins: string[];
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseNumber(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return parsed;
}

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();

  if (!raw) {
    return ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  if (parseCorsOrigins().includes(origin)) {
    return true;
  }

  return isVercelPreviewOrigin(origin);
}

export const env: Env = {
  get nodeEnv() {
    return process.env.NODE_ENV ?? 'development';
  },
  get port() {
    return parseNumber('PORT', 4000);
  },
  get mongodbUri() {
    return requireEnv('MONGODB_URI');
  },
  get mongodbDbName() {
    return process.env.MONGODB_DB_NAME?.trim() || 'gess-mini-app';
  },
  get telegramBotToken() {
    return requireEnv('TELEGRAM_BOT_TOKEN');
  },
  get jwtSecret() {
    return requireEnv('JWT_SECRET');
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN ?? '7d';
  },
  get telegramInitDataMaxAgeSeconds() {
    return parseNumber('TELEGRAM_INIT_DATA_MAX_AGE_SECONDS', 86_400);
  },
  get corsOrigins() {
    return parseCorsOrigins();
  },
};
