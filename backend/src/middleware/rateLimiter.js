import rateLimit from 'express-rate-limit';

function handler(req, res) {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait a moment and try again.',
  });
}

function skipInTest() {
  return process.env.NODE_ENV === 'test';
}

export const apiLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const authLimiter = rateLimit({
  skip: skipInTest,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
