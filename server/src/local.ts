import { getApp } from './lib/expressApp.js';
import { connectToDatabase } from './config/database.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectToDatabase();

  const app = getApp();

  app.listen(env.port, () => {
    console.log(`Backend listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start backend locally', error);
  process.exit(1);
});
