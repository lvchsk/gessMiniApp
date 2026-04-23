import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from './appError.js';

interface TelegramUserPayload {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface VerifiedTelegramUser {
  telegramId: number;
  username: string;
}

function getSecretKey(botToken: string): Buffer {
  return crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
}

function buildDataCheckString(params: URLSearchParams): string {
  return [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function getSafeUsername(user: TelegramUserPayload): string {
  const username =
    user.username?.trim() ||
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
    `user_${user.id}`;

  return username.slice(0, 64);
}

export function verifyTelegramInitData(initData: string): VerifiedTelegramUser {
  if (!initData?.trim()) {
    throw new AppError('Telegram initData is required', 400);
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new AppError('Telegram initData hash is missing', 401);
  }

  const dataCheckString = buildDataCheckString(params);
  const secretKey = getSecretKey(env.telegramBotToken);
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const providedHash = Buffer.from(hash, 'hex');
  const calculatedHash = Buffer.from(expectedHash, 'hex');

  if (
    providedHash.length !== calculatedHash.length ||
    !crypto.timingSafeEqual(providedHash, calculatedHash)
  ) {
    throw new AppError('Telegram initData validation failed', 401);
  }

  const authDate = Number(params.get('auth_date'));

  if (!Number.isInteger(authDate)) {
    throw new AppError('Telegram auth_date is invalid', 401);
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (nowInSeconds - authDate > env.telegramInitDataMaxAgeSeconds) {
    throw new AppError('Telegram initData is too old', 401);
  }

  const userRaw = params.get('user');

  if (!userRaw) {
    throw new AppError('Telegram user payload is missing', 401);
  }

  let user: TelegramUserPayload;

  try {
    user = JSON.parse(userRaw) as TelegramUserPayload;
  } catch {
    throw new AppError('Telegram user payload is invalid JSON', 400);
  }

  if (!Number.isSafeInteger(user.id)) {
    throw new AppError('Telegram user id is invalid', 400);
  }

  return {
    telegramId: Number(user.id),
    username: getSafeUsername(user),
  };
}
