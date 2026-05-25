const buckets = new Map();

function rateLimiter({ windowMs = 60_000, max = 100 } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(max - bucket.count, 0)));

    if (bucket.count > max) {
      return res.status(429).json({ message: 'Too many requests' });
    }

    next();
  };
}

module.exports = rateLimiter;
