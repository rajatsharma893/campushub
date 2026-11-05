const rateLimit = require('express-rate-limit');

const make = (windowMinutes, limit, message, options = {}) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message },
    ...options,
  });

// Poori API par: ek IP se 15 minute mein 1000 requests
const apiLimiter = make(15, 1000, 'Too many requests. Please slow down and try again shortly.');

// Login: ek email par 15 minute mein 10 galat koshish (sahi login count nahi hote)
const loginLimiter = make(15, 10, 'Too many login attempts. Please try again in 15 minutes.', {
  skipSuccessfulRequests: true,
  keyGenerator: (req) => String((req.body && req.body.email) || 'unknown').toLowerCase().slice(0, 120),
});

// Sign up: ek ghante mein 5 naye account ek IP se
const registerLimiter = make(60, 5, 'Too many sign-ups from this network. Please try again later.');

// Password change: 15 minute mein 10 koshish
const passwordLimiter = make(15, 10, 'Too many attempts. Please try again in 15 minutes.');

module.exports = { apiLimiter, loginLimiter, registerLimiter, passwordLimiter };
