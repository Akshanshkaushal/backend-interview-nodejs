const redis = require('redis');

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.on('connect', () => console.log('Redis connected'));

(async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
  } catch (error) {
    console.error('Redis unavailable:', error.message);
  }
})();

module.exports = redisClient;
