import Redis from 'ioredis';

let redisClient = null;
let isConnected = false;

/**
 * Initializes or returns Redis connection
 */
export function getRedisClient() {
  if (redisClient) {
    return { client: redisClient, isConnected: () => isConnected };
  }

  // Only connect if REDIS_URL is explicitly provided or enabled
  const redisUrl = process.env.REDIS_URL;

  // In test environment or when explicitly disabled, default to fallback
  if (process.env.NODE_ENV === 'test' || !redisUrl) {
    return { client: null, isConnected: () => false };
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) return null; // Stop retrying quickly to use fallback
        return 500;
      },
      lazyConnect: true,
      enableOfflineQueue: false
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log(`[Redis] Connected successfully to ${redisUrl}`);
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      if (err.code !== 'ECONNREFUSED' && err.code !== 'EACCES') {
        console.warn(`[Redis] Notice: ${err.message}`);
      }
    });

    redisClient.connect().catch(() => {
      isConnected = false;
    });

  } catch {
    redisClient = null;
    isConnected = false;
  }

  return { client: redisClient, isConnected: () => isConnected };
}

/**
 * Disconnects Redis client cleanly (used in test teardown)
 */
export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore force close
    }
    redisClient = null;
    isConnected = false;
  }
}
