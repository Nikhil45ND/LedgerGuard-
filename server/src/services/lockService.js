import crypto from 'node:crypto';
import { getRedisClient } from '../config/redis.js';

// In-memory fallback lock map for environments without an active Redis instance
const inMemoryLocks = new Map();

// Lua script to safely release Redis lock only if the token matches
const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

/**
 * Acquires a distributed lock using Redis (with seamless in-memory fallback)
 * @param {string} lockKey - Unique identifier for the locked resource
 * @param {number} ttlMs - Lock time-to-live in milliseconds (default: 5000ms)
 * @returns {Promise<{ acquired: boolean, token: string|null, release: Function }>}
 */
export async function acquireLock(lockKey, ttlMs = 5000) {
  const token = crypto.randomUUID();
  const { client, isConnected } = getRedisClient();

  if (isConnected() && client) {
    try {
      // SET resource token NX PX ttlMs
      const result = await client.set(lockKey, token, 'PX', ttlMs, 'NX');
      if (result === 'OK') {
        return {
          acquired: true,
          token,
          release: async () => releaseLock(lockKey, token)
        };
      }
      return { acquired: false, token: null, release: async () => {} };
    } catch (err) {
      console.warn(`[LockService] Redis lock failed (${err.message}). Falling back to in-memory lock.`);
    }
  }

  // --- In-Memory Fallback ---
  const existing = inMemoryLocks.get(lockKey);
  const now = Date.now();

  if (existing && existing.expiresAt > now) {
    // Lock already held
    return { acquired: false, token: null, release: async () => {} };
  }

  // Set in-memory lock with expiry
  const timeoutId = setTimeout(() => {
    inMemoryLocks.delete(lockKey);
  }, ttlMs);

  inMemoryLocks.set(lockKey, {
    token,
    expiresAt: now + ttlMs,
    timeoutId
  });

  return {
    acquired: true,
    token,
    release: async () => releaseLock(lockKey, token)
  };
}

/**
 * Safely releases a distributed lock using atomic token comparison
 * @param {string} lockKey 
 * @param {string} token 
 * @returns {Promise<boolean>}
 */
export async function releaseLock(lockKey, token) {
  const { client, isConnected } = getRedisClient();

  if (isConnected() && client) {
    try {
      const res = await client.eval(RELEASE_LOCK_LUA, 1, lockKey, token);
      return res === 1;
    } catch (err) {
      console.warn(`[LockService] Redis release lock error: ${err.message}`);
    }
  }

  // --- In-Memory Fallback ---
  const existing = inMemoryLocks.get(lockKey);
  if (existing && existing.token === token) {
    clearTimeout(existing.timeoutId);
    inMemoryLocks.delete(lockKey);
    return true;
  }

  return false;
}
