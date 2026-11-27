/**
 * Idempotency Middleware
 * Intercepts and validates the Idempotency-Key header on critical state-changing financial routes
 */
export function requireIdempotencyKey(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
    const error = new Error('Header "Idempotency-Key" is required for this operation');
    error.statusCode = 400;
    return next(error);
  }

  const cleanKey = idempotencyKey.trim();
  if (cleanKey.length > 128) {
    const error = new Error('Header "Idempotency-Key" cannot exceed 128 characters');
    error.statusCode = 400;
    return next(error);
  }

  req.idempotencyKey = cleanKey;
  next();
}
