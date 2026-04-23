import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectToDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  await mongoose.connect(env.mongodbUri, {
    dbName: 'gess-mini-app',
  });

  isConnected = true;
}
