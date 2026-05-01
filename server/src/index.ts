import 'express';
import { getApp } from './lib/expressApp.js';
import { connectToDatabase } from './config/database.js';

await connectToDatabase();

const app = getApp();

export default app;
