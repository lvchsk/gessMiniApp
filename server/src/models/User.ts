import { Schema, model, models, type Model } from 'mongoose';
import { formatDate } from '../lib/formatDate.js';

export interface UserDocument {
  telegramId: number;
  username: string;
  registrationDate: string;
  scoreRunner: number;
  scoreMatch: number;
}

const userSchema = new Schema<UserDocument>(
  {
    telegramId: { type: Number, unique: true, required: true, index: true },
    username: { type: String, required: true, trim: true },
    registrationDate: {
      type: String,
      default: () => formatDate(new Date()),
    },
    scoreRunner: { type: Number, default: 0, min: 0 },
    scoreMatch: { type: Number, default: 0, min: 0 },
  },
  {
    versionKey: false,
  },
);

userSchema.index({ scoreRunner: -1, telegramId: 1 });
userSchema.index({ scoreMatch: -1, telegramId: 1 });

export const UserModel =
  (models.User as Model<UserDocument> | undefined) ?? model<UserDocument>('User', userSchema);
