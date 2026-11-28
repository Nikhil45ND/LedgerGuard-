import { getRedisClient } from '../config/redis.js';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const RATE_LIMIT_SCRIPT = `
  local current = redis.call('INCR', KEYS[1])

  if current == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end

  local ttl = redis.call('PTTL', KEYS[1])

  return { current, ttl }
`;

export async function registrationRateLimiter(req, res, next) {
  // Keep automated tests independent of a Redis server.
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const { client } = getRedisClient();

  // Fail closed: never allow public registration without rate limiting.
  if (!client || client.status !== 'ready') {
    return res.status(503).json({
      success: false,
      message: 'Registration is temporarily unavailable. Please try again later.'
    });
  }

  const clientIp = req.ip || req.socket.remoteAddress;

  if (!clientIp) {
    return res.status(400).json({
      success: false,
      message: 'Unable to identify the client.'
    });
  }

  const key = `rate-limit:tenant-registration:${encodeURIComponent(clientIp)}`;

  try {
    const [attempts, ttl] = await client.eval(
      RATE_LIMIT_SCRIPT,
      1,
      key,
      WINDOW_MS
    );

    const remaining = Math.max(0, MAX_ATTEMPTS - Number(attempts));
    const retryAfter = Math.max(1, Math.ceil(Number(ttl) / 1000));

    res.setHeader('RateLimit-Limit', MAX_ATTEMPTS);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader(
      'RateLimit-Reset',
      Math.ceil((Date.now() + Number(ttl)) / 1000)
    );

    if (Number(attempts) > MAX_ATTEMPTS) {
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        success: false,
        message: 'Too many registration attempts. Please try again later.',
        retryAfterSeconds: retryAfter
      });
    }

    return next();
  } catch (error) {
    console.error('[Registration Rate Limiter] Redis error:', error.message);

    return res.status(503).json({
      success: false,
      message: 'Registration is temporarily unavailable. Please try again later.'
    });
  }
}