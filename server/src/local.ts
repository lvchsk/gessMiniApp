import app from './index.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});
