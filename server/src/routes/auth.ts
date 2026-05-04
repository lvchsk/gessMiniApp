import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/appError.js';
import { signSessionToken } from '../lib/jwt.js';
import { verifyTelegramInitData } from '../lib/telegram.js';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/auth.js';
import { findOrCreateUser, serializeUser } from '../services/users.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/telegram',
  authLimiter,
  asyncHandler(async (req, res) => {
    const initData = typeof req.body?.initData === 'string' ? req.body.initData : '';

    if (!initData) {
      throw new AppError('initData is required', 400);
    }

    const verifiedUser = verifyTelegramInitData(initData);
    const user = await findOrCreateUser(verifiedUser.telegramId, verifiedUser.username);
    const token = signSessionToken(String(user._id), user.telegramId);

    res.status(200).json({
      token,
      user: serializeUser(user),
    });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authReq = req as AuthenticatedRequest;

    res.status(200).json({
      user: serializeUser(authReq.user),
    });
  }),
);

export default router;
