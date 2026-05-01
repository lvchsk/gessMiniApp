import mongoose from 'mongoose';
import { env } from './env.js';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // Reuse the same connection across warm serverless invocations and local reloads.
  var __mongooseCache__: MongooseCache | undefined;
}

const mongooseCache = globalThis.__mongooseCache__ ?? {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache__ = mongooseCache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(env.mongodbUri, {
      dbName: env.mongodbDbName,
    });
  }

  try {
    mongooseCache.conn = await mongooseCache.promise;
    return mongooseCache.conn;
  } catch (error) {
    mongooseCache.promise = null;
    throw error;
  }
}
