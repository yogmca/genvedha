/**
 * Rate Limiting Middleware
 */

const { config } = require('../config');

const requestCounts = new Map();

function rateLimiter(req, res, next) {
  const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const windowMs = config.security.rateLimit.windowMs;
  const maxRequests = config.security.rateLimit.maxRequests;

  let record = requestCounts.get(identifier);
  
  if (!record) {
    record = { count: 0, resetTime: now + windowMs };
    requestCounts.set(identifier, record);
  }

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${retryAfter} seconds.`,
      retryAfter
    });
  }

  record.count++;

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);

  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [identifier, record] of requestCounts.entries()) {
    if (now > record.resetTime + 60000) {
      requestCounts.delete(identifier);
    }
  }
}, 60000);

module.exports = { rateLimiter };
