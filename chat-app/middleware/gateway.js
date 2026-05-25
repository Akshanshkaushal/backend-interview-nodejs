const crypto = require('crypto');
const rateLimiter = require('./rateLimiter');

const apiRateLimit = rateLimiter({
  windowMs: 60_000,
  max: 120,
});

function requestId(req, res, next) {
  req.requestId = crypto.randomUUID();
  res.set('X-Request-Id', req.requestId);
  next();
}

function gateway(req, res, next) {
  requestId(req, res, () => {
    apiRateLimit(req, res, next);
  });
}

module.exports = gateway;
