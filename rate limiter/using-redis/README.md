# Rate Limiter using Redis

This is a production-grade rate limiter implementation using Redis for distributed request tracking.

## How it works

- **Max Allowed Requests**: 5 requests per IP
- **Time Window**: 10 seconds
- **Storage**: Redis database
- **Key Format**: `ip:{ip_address}` with automatic expiration

## Features

✅ Distributed system support (multiple servers)
✅ Data persistence
✅ Automatic key expiration
✅ Fast in-memory operations
✅ Suitable for production
✅ Returns 429 (Too Many Requests) when limit exceeded

## Prerequisites

You need Redis running on your machine:

### Windows
```bash
# Using WSL or Docker Desktop with Redis image
docker run -d -p 6379:6379 redis:latest
```

### macOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

### Linux
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

Test with requests:
```bash
curl http://localhost:8000/
```

Send multiple requests rapid-fire to test the rate limiting:
```bash
for i in {1..10}; do curl http://localhost:8000/; echo "Request $i"; done
```

## Configuration

Modify these values in `index.js`:

```javascript
const MAX_ALLOWED_REQ = 5;  // Maximum requests per IP
const MAX_TIME = 10;         // Time window in seconds (Redis expiration)
```

## Redis Configuration

Default Redis connection settings:
- **Host**: localhost
- **Port**: 6379

To change these, modify:
```javascript
const redisClient = redis.createClient({
  host: "your-host",
  port: 6379,
});
```

## Advantages over Map approach

1. **Distributed**: Works across multiple servers
2. **Persistent**: Data survives server restarts
3. **Scalable**: Can handle high traffic
4. **Production-ready**: Industry standard for rate limiting
5. **Automatic cleanup**: Redis automatically expires keys

## Monitoring Redis

```bash
# Check all keys
redis-cli KEYS "*"

# Check specific IP data
redis-cli GET "ip:192.168.x.x"

# Monitor real-time commands
redis-cli MONITOR
```
