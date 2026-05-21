# Rate Limiter Implementations

This folder contains two complete, production-ready rate limiter implementations using different approaches.

## 📁 Structure

```
rate limiter/
├── using-map/              # In-memory Map-based implementation
│   ├── index.js           # Main server with rate limiter middleware
│   ├── helpers.js         # MapRateLimiter utility class
│   ├── package.json       # Dependencies
│   └── README.md          # Detailed documentation
│
├── using-redis/           # Redis-based implementation
│   ├── index.js           # Main server with rate limiter middleware
│   ├── helpers.js         # RedisRateLimiter utility class
│   ├── package.json       # Dependencies
│   └── README.md          # Detailed documentation
│
├── COMPARISON.md          # Detailed comparison between both approaches
└── README.md              # This file
```

## 🚀 Quick Start

### Option 1: Map-Based (Simple, Single Server)

```bash
# Navigate to the folder
cd "using-map"

# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:8000
```

### Option 2: Redis-Based (Production, Distributed)

```bash
# Make sure Redis is running first
redis-server

# In another terminal
cd "using-redis"

# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:8000
```

## 🧪 Testing Rate Limiter

### Test Script - Send 10 Requests

```bash
# Windows PowerShell
for ($i = 1; $i -le 10; $i++) { 
  curl http://localhost:8000/
  Write-Host "Request $i"
  Start-Sleep -Milliseconds 100
}

# Linux/Mac
for i in {1..10}; do 
  curl http://localhost:8000/
  echo "Request $i"
  sleep 0.1
done
```

### Expected Results

- **Requests 1-5**: ✅ Status 200 - `{"ok": true}`
- **Requests 6-10**: ❌ Status 429 - `{"message": "Too many requests"}`

## 📊 Comparison at a Glance

| Aspect | Map | Redis |
|--------|-----|-------|
| **Setup** | Easiest | Requires Redis |
| **Single Server** | ✅ Perfect | ✅ Works |
| **Multiple Servers** | ❌ No | ✅ Yes |
| **Persistence** | ❌ No | ✅ Yes |
| **Production Ready** | ⚠️ Limited | ✅ Yes |
| **Memory Efficient** | ⚠️ Grows | ✅ Managed |

👉 **See [COMPARISON.md](./COMPARISON.md) for detailed comparison**

## 🎯 When to Use Which

### Use Map When:
- Learning/prototyping
- Single server deployment
- Low traffic
- Development environment
- Simplicity is priority

### Use Redis When:
- Production environment
- Multiple servers/microservices
- High traffic
- Data persistence needed
- Cloud/containerized deployment

## 📦 What's Included

### Both Implementations Provide:

✅ **Middleware** - Ready-to-use Express middleware
✅ **IP Tracking** - Per-IP address rate limiting
✅ **Auto Cleanup** - Automatic request count reset/expiration
✅ **Error Handling** - Graceful error management
✅ **Logging** - Console logging for debugging
✅ **Helper Classes** - Utility classes for easy integration
✅ **README Docs** - Comprehensive documentation
✅ **Examples** - Usage examples included

## 🔧 Configuration

Both implementations are configured for:
- **Max Requests**: 5 per IP address
- **Time Window**: 10 seconds

To change these, edit the constants in `index.js`:

```javascript
const MAX_ALLOWED_REQ = 5;    // Change request limit
const MAX_TIME = 10_000;      // Change time window (milliseconds in Map, seconds in Redis)
```

## 🛠️ Installation Steps by Implementation

### Map Implementation

```bash
cd using-map
npm install
npm start
```

No additional setup needed. Just Node.js and npm.

### Redis Implementation

**Prerequisites**: Redis must be installed and running

```bash
# Start Redis (if you have it installed)
redis-server

# In another terminal
cd using-redis
npm install
npm start
```

## 📝 API Endpoints

### GET /

Returns success response if within rate limit:

**Success (200)**:
```json
{
  "ok": true
}
```

**Rate Limited (429)**:
```json
{
  "message": "Too many requests"
}
```

## 🔍 Monitoring

### Map Implementation

Check request counts in server logs:
```
Running on port 8000
Received request no 1 from 192.168.x.x
Received request no 2 from 192.168.x.x
...
Too many requests (on 6th request)
IP mapping cleared (after 10 seconds)
```

### Redis Implementation

Monitor with Redis CLI:

```bash
# List all tracked IPs
redis-cli KEYS "ip:*"

# Check specific IP count
redis-cli GET "ip:192.168.1.1"

# Check TTL (seconds remaining)
redis-cli TTL "ip:192.168.1.1"

# Monitor all commands in real-time
redis-cli MONITOR
```

## 🚀 Next Steps

1. **Choose your implementation** based on your needs
2. **Install dependencies** with `npm install`
3. **Start the server** with `npm start`
4. **Test with curl** or any HTTP client
5. **Customize configuration** if needed
6. **Integrate into your app** using the helper classes

## 📚 Detailed Documentation

- [Map Implementation Details](./using-map/README.md)
- [Redis Implementation Details](./using-redis/README.md)
- [Detailed Comparison](./COMPARISON.md)

## 🤝 Helper Classes

Both folders include helper classes that make integration easier:

```javascript
// Map approach
const MapRateLimiter = require('./helpers.js');
const limiter = new MapRateLimiter(5, 10000);

// Redis approach  
const RedisRateLimiter = require('./helpers.js');
const limiter = new RedisRateLimiter(redisClient, 5, 10);
```

## 💡 Pro Tips

1. **Gradual Migration**: Start with Map, migrate to Redis when ready
2. **Different Limits**: Use different limits for different endpoints
3. **Monitoring**: Set up logging/monitoring for rate limit violations
4. **Documentation**: The COMPARISON.md file has production recommendations

## ⚠️ Important Notes

- Map-based approach loses all data on server restart
- Redis approach requires Redis infrastructure
- Both implementations use the client's IP address
- Configure firewall if deploying to production
- Always use Redis for production public APIs

## 🆘 Troubleshooting

**Map not limiting?**
- Check browser cache - send new requests
- Verify MAX_TIME hasn't passed (resets every 10 seconds)

**Redis not working?**
- Ensure Redis is running: `redis-server`
- Check connection: `redis-cli ping` (should return PONG)
- Verify port (default 6379)

## 📄 License

MIT

---

**Happy Rate Limiting! 🚀**
