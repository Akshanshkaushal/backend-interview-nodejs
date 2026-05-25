# Redis Streams Chat Application - Setup Guide

## Complete Installation & Running Instructions

### Part 1: Prerequisites

#### 1.1 Install Node.js (if not already installed)
```bash
# Check if installed
node --version
npm --version
```

#### 1.2 Install Redis

**Option A: Docker (Recommended)**
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

**Option B: Windows (via WSL)**
```bash
wsl
sudo apt-get install redis-server
sudo service redis-server start
```

**Option C: macOS (via Homebrew)**
```bash
brew install redis
brew services start redis
```

**Verify Redis is running:**
```bash
redis-cli ping
```
Expected output: `PONG`

#### 1.3 Install MongoDB

**Option A: Docker**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

**Option B: Local Installation**
- Download from https://www.mongodb.com/try/download/community
- Follow installation steps

**Verify MongoDB is running:**
```bash
mongosh
> db.adminCommand('ping')
```
Expected output: `{ ok: 1 }`

---

### Part 2: Project Setup

#### 2.1 Navigate to chat-app folder
```bash
cd c:\Users\aksha\Desktop\backend\chat-app
```

#### 2.2 Install dependencies
```bash
npm install
```

Expected packages:
- express ^4.18.2
- socket.io ^4.5.4
- mongoose ^7.0.0
- redis ^4.6.5
- dotenv ^16.0.3

#### 2.3 Create `.env` file
```bash
# Create .env in chat-app root directory
```

Add these lines:
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/chat-app

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Consumer
CONSUMER_WORKERS=2

# JWT (optional for auth)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d
```

---

### Part 3: Directory Structure Check

Verify these files exist (created in previous steps):

```
chat-app/
├── config/
│   ├── db.js
│   ├── redis.js
│   └── streams.js ✅ (NEW)
├── services/
│   ├── streamProducer.js ✅ (NEW)
│   ├── streamConsumer.js ✅ (NEW)
│   └── consumerManager.js ✅ (NEW)
├── scripts/
│   └── startConsumers.js ✅ (NEW)
├── utils/
│   └── socketHandler.js ✅ (UPDATED)
├── package.json ✅ (UPDATED with consumer scripts)
├── server.js
├── IMPLEMENTATION_SUMMARY.md ✅ (NEW)
└── REDIS_STREAMS_GUIDE.md ✅ (NEW)
```

If any files are missing, they were created in previous steps.

---

### Part 4: Running the Application

#### 4.1 Terminal Setup (3 separate terminals)

**Terminal 1: Start the Chat Server**
```bash
cd c:\Users\aksha\Desktop\backend\chat-app
npm run dev
```

**Expected output:**
```
✅ MongoDB Connected
✅ Redis Connected
🚀 Chat server running on port 3000
```

**Terminal 2: Start Redis Consumer Worker**
```bash
cd c:\Users\aksha\Desktop\backend\chat-app
npm run consumer
```

**Expected output:**
```
🚀 Starting Redis Streams Consumer...

✅ Redis Connected

✅ 2 message consumer(s) started

📊 Status:
   Running Consumers: 2/2

📝 Consumer is running. Press Ctrl+C to stop.
```

**Terminal 3: Test Client (Optional)**
```bash
# For testing via curl or Postman
# Or use the CLIENT_EXAMPLE.js file
node CLIENT_EXAMPLE.js
```

---

### Part 5: Integration with server.js

Your `server.js` should include consumer startup:

```javascript
// At the top of server.js
const express = require('express');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const redisClient = require('./config/redis');
const { getConsumerManager } = require('./services/consumerManager');

const app = express();

// ... middleware setup ...

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Start consumer manager
const startApp = async () => {
  try {
    const consumerManager = getConsumerManager();
    await consumerManager.startConsumers(parseInt(process.env.CONSUMER_WORKERS || 2));
    console.log('✅ Redis Streams Consumer started');
  } catch (error) {
    console.error('❌ Error starting consumer:', error);
  }

  const server = app.listen(3000, () => {
    console.log('🚀 Chat server running on port 3000');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await consumerManager.stopAllConsumers();
    server.close();
    await mongoose.connection.close();
    await redisClient.quit();
    process.exit(0);
  });
};

startApp();
```

---

### Part 6: System Architecture Flow

When a user sends a message:

```
Client (Browser)
    ↓
Socket.IO Event: socket.on('message:send', data)
    ↓
Socket Handler (socketHandler.js)
    ↓
Redis Stream Producer (streamProducer.js)
    Message added to: stream:messages
    ↓ [⚡ < 10ms]
    ↓
Return immediately to client with streamId
    ↓
Consumer Workers (N instances)
    Reading from stream continuously
    ↓
    Process message (validate, enrich)
    ↓
    Save to MongoDB
    ↓
    Acknowledge in Redis (remove from pending)
    ↓
Message Saved ✅
```

---

### Part 7: Testing the System

#### 7.1 Test 1: Single Message
```bash
# Using curl from Terminal 3
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "test", "content": "Hello"}'
```

**Expected:**
- Message appears in MongoDB
- No console errors
- Consumer logs show processing

#### 7.2 Test 2: High Volume (Stress Test)
```javascript
// Create a test script: test-load.js
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');
  
  // Send 100 messages rapidly
  for (let i = 0; i < 100; i++) {
    socket.emit('message:send', {
      conversationId: 'test-conv',
      content: `Test message ${i}`
    });
  }
});

socket.on('message:sent', (data) => {
  console.log('Message sent:', data.streamId);
});
```

**Run:**
```bash
node test-load.js
```

**Expected:**
- All messages return immediately
- No database crash
- Consumer processes messages smoothly
- Check MongoDB: `db.messages.countDocuments()`

#### 7.3 Test 3: Monitor Stream
```bash
# In a new terminal
redis-cli

# Check pending messages
> XLEN stream:messages

# Check consumer group
> XINFO GROUPS stream:messages

# Check Dead Letter Queue
> XLEN stream:messages:dlq
```

---

### Part 8: Monitoring Commands

#### Check Consumer Health
```bash
# Terminal with running consumer will show:
📊 Status:
   Running Consumers: 2/2
```

#### Check Redis Stream
```bash
redis-cli
> XINFO STREAM stream:messages
> XLEN stream:messages  # Number of pending messages
```

#### Check MongoDB
```bash
mongosh
> use chat-app
> db.messages.find().limit(5)
> db.messages.countDocuments()
```

#### Check Consumer Lag
```bash
redis-cli
> XINFO GROUPS stream:messages
# Check "lag" field - should be 0 for up-to-date consumer
```

---

### Part 9: Troubleshooting

#### Issue: "Redis Connection Error"
**Solution:**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis:
docker run -d -p 6379:6379 redis:latest
```

#### Issue: "MongoDB Connection Error"
**Solution:**
```bash
# Check MongoDB is running
mongosh ping
# Should return: { ok: 1 }

# If not running, start MongoDB:
docker run -d -p 27017:27017 mongo:latest
```

#### Issue: "Consumer not processing messages"
**Solution:**
```bash
# Restart consumer
# Terminal 2: Press Ctrl+C
# Then run again:
npm run consumer

# Check consumer group:
redis-cli
> XINFO GROUPS stream:messages
```

#### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Option 1: Change port in .env
PORT=3001

# Option 2: Kill process using port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

#### Issue: "Messages not saving to database"
**Solution:**
```bash
# Check MongoDB connection:
mongosh
> use chat-app
> db.messages.countDocuments()

# Check consumer logs for errors
# Terminal 2 should show error messages

# Restart consumer:
npm run consumer
```

---

### Part 10: Performance Verification

Run this test to verify system handles high throughput:

```bash
# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Or download from: https://httpd.apache.org/download.cgi

# Benchmark with 1000 requests, 100 concurrent
ab -n 1000 -c 100 http://localhost:3000/health

# Expected: All requests complete successfully
# Response time: < 100ms
# No failed requests
```

---

### Part 11: NPM Commands Reference

```bash
# Start chat server (production)
npm start

# Start chat server (development with auto-reload)
npm run dev

# Start consumer worker
npm run consumer

# Start consumer worker (development with auto-reload)
npm run consumer:dev
```

---

### Part 12: Production Checklist

Before deploying to production:

- [ ] Redis persistence enabled (AOF or RDB)
- [ ] MongoDB backups configured
- [ ] Consumer worker restarted automatically on failure (PM2 or systemd)
- [ ] Environment variables properly set
- [ ] Error monitoring setup (Sentry/New Relic)
- [ ] Load testing completed
- [ ] DLQ monitoring in place
- [ ] Redis memory limits configured
- [ ] Database connection pooling enabled
- [ ] CORS origin properly configured
- [ ] HTTPS enabled
- [ ] Rate limiting implemented

---

### Part 13: Next Steps

1. **Test the system** using Part 7 tests above
2. **Monitor performance** using Part 8 commands
3. **Review logs** in each terminal for any errors
4. **Scale consumers** if needed (increase CONSUMER_WORKERS)
5. **Implement monitoring** dashboard (optional)
6. **Set up alerts** for Dead Letter Queue

---

## Success Criteria

✅ System is working correctly when:

1. Chat server starts without errors
2. Consumer worker shows "2 message consumer(s) started"
3. Sending messages returns instantly (< 50ms)
4. Messages appear in MongoDB within a few seconds
5. Redis stream length stays low (< 10 pending messages)
6. Consumer group shows lag of 0
7. No errors in any terminal
8. Test messages save successfully to database

---

## Need Help?

Check these files for more information:

- **IMPLEMENTATION_SUMMARY.md** - Quick reference guide
- **REDIS_STREAMS_GUIDE.md** - Detailed architecture & concepts
- **ARCHITECTURE.md** - System overview
- **README.md** - General information

---

**Last Updated:** 2024
**Redis Streams Version:** 1.0
**Node.js Minimum Version:** 14.x
