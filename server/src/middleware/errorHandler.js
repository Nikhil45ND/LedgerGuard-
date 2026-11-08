/**
 * Central Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Mongoose validation error formatting
  let message = err.message || 'Internal Server Error';
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    message = `Validation Error: ${messages.join(', ')}`;
  }

  // Mongoose duplicate key error formatting
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Must be unique.`;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
