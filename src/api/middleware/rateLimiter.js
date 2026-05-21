const rateLimit = require('express-rate-limit');

const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { chatRateLimiter };
