import dotenv from 'dotenv';

dotenv.config();

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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseNumber('PORT', 4000),
  mongodbUri: requireEnv('MONGODB_URI'),
  telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  telegramInitDataMaxAgeSeconds: parseNumber('TELEGRAM_INIT_DATA_MAX_AGE_SECONDS', 86_400),
  corsOrigins: parseCorsOrigins(),
};
