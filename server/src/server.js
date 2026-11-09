import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { getRedisClient } from './config/redis.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  console.log('--- Initializing LedgerGuard Billing Engine ---');

  // Connect to MongoDB
  await connectDB();

  // Initialize Redis coordination (with automatic fallback)
  getRedisClient();

  app.listen(PORT, () => {
    console.log(`[Server] LedgerGuard Billing Engine running on http://localhost:${PORT}`);
    console.log(`[Health] http://localhost:${PORT}/health`);
  });
}

bootstrap().catch(err => {
  console.error('[Bootstrap] Fatal startup error:', err);
  process.exit(1);
});
