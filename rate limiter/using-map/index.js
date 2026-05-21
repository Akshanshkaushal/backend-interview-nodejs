const express = require("express");
const ip = require("ip");

// Configure rate limiter
const MAX_ALLOWED_REQ = 5;
const MAX_TIME = 10_000; // 10 seconds

// In-memory Map to store IP request counts
let ip_mapping = {};

const app = express();

// Clear IP mapping every MAX_TIME seconds
setInterval(() => {
  ip_mapping = {};
  console.log("IP mapping cleared");
}, MAX_TIME);

// Rate limiter middleware using Map
app.use((req, res, next) => {
  const my_ip = ip.address();

  // Increment request count for this IP
  ip_mapping[my_ip] = ip_mapping[my_ip] + 1 || 1;

  console.log(
    `Received request no ${ip_mapping[my_ip]} from ${my_ip}`
  );

  // Check if request count exceeds limit
  if (ip_mapping[my_ip] > MAX_ALLOWED_REQ) {
    console.error("Too many requests");
    return res.status(429).json({ message: "Too many requests" });
  }

  next();
});

app.get("/", (req, res) => {
  console.log("Received a request");
  res.status(200).json({ ok: true });
});

app.listen(8000, () => console.log("Running on port 8000"));
