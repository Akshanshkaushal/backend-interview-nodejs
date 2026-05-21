const express = require("express");
const redis = require("redis");
const ip = require("ip");

// Configure rate limiter
const MAX_ALLOWED_REQ = 5;
const MAX_TIME = 10; // 10 seconds

const app = express();

// Initialize Redis client
const redisClient = redis.createClient({
  host: "localhost",
  port: 6379,
});

// Handle Redis connection
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// Connect to Redis
redisClient.connect();

// Rate limiter middleware using Redis
app.use(async (req, res, next) => {
  try {
    const my_ip = ip.address();
    const key = `ip:${my_ip}`;

    // Increment request count in Redis
    const request_count = await redisClient.incr(key);

    // Set expiration on first request
    if (request_count === 1) {
      await redisClient.expire(key, MAX_TIME);
    }

    console.log(
      `Received request no ${request_count} from ${my_ip}`
    );

    // Check if request count exceeds limit
    if (request_count > MAX_ALLOWED_REQ) {
      console.error("Too many requests");
      return res.status(429).json({ message: "Too many requests" });
    }

    next();
  } catch (error) {
    console.error("Error in rate limiter:", error);
    next();
  }
});

app.get("/", (req, res) => {
  console.log("Received a request");
  res.status(200).json({ ok: true });
});

app.listen(8000, () => console.log("Running on port 8000"));

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await redisClient.quit();
  process.exit(0);
});
