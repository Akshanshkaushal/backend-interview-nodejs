/**
 * Redis Streams Implementation Guide
 * High-Throughput Chat Message Handling
 */

# Redis Streams for Chat Applications

## Problem: High Throughput Database Crashes

**Without Redis Streams:**
```
User sends message
    ↓
Server saves directly to database
    ↓
If 1000 users send messages simultaneously:
Database receives 1000 writes at once → CRASH! ❌
```

**With Redis Streams:**
```
User sends message
    ↓
Produce to Redis Stream (instant, non-blocking)
    ↓
Return response to user immediately ✅
    ↓
Consumer workers read from stream slowly
    ↓
Save to database without overwhelming it ✅
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     WebSocket Clients                        │
└──────────────────────────┬──────────────────────────────────┘
                      │
                      │ message:send
                      ↓
    ┌─────────────────────────────────┐
    │   Socket.IO Server              │
    │  (message:send handler)          │
    └────────────┬────────────────────┘
                 │
         ⚡ PRODUCES MESSAGE ⚡
                 │
                 ↓
    ┌──────────────────────────────────┐
    │   Redis Stream                    │
    │   stream:messages                 │
    │   (High-speed buffer)             │
    │                                  │
    │  Message 1 ┌────────────┐        │
    │  Message 2 │ PENDING    │        │
    │  Message 3 │ (Consumer) │        │
    │  Message 4 └────────────┘        │
    └──────────────┬────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ↓                 ↓
    ┌──────────┐       ┌──────────┐
    │ Consumer │       │ Consumer │
    │ Worker 1 │       │ Worker 2 │
    └────┬─────┘       └────┬─────┘
         │                  │
    🔄 CONSUMES MESSAGES 🔄
         │                  │
         └────────┬─────────┘
                  │
                  ↓
        ┌──────────────────┐
        │   MongoDB        │
        │  (Slow writes OK)│
        └──────────────────┘
```

---

## Key Benefits

| Aspect | Without Streams | With Streams |
|--------|-----------------|--------------|
| **Throughput** | Limited by DB | Unlimited by Redis |
| **Response Time** | Depends on DB | Always instant |
| **Database Load** | Spike of 1000 writes | Smooth 10 writes/sec |
| **Message Loss** | Easy to lose | Guaranteed delivery |
| **Scalability** | Must upgrade DB | Just add workers |
| **Latency** | High variance | Low latency |

---

## Implementation Components

### 1. **StreamProducer** (`services/streamProducer.js`)

Fast non-blocking producer that adds messages to Redis Stream.

```javascript
// Usage in socket handler:
await StreamProducer.produceMessage({
  senderId: userId,
  conversationId: convId,
  content: "Hello!",
  messageId: generateId(),
  timestamp: new Date()
});

// Returns instantly - doesn't wait for DB
```

**Key methods:**
- `produceMessage()` - Add single message to stream
- `produceBatchMessages()` - Add multiple messages
- `getStreamLength()` - Check pending messages count
- `trimStream()` - Cleanup old messages

### 2. **StreamConsumer** (`services/streamConsumer.js`)

Worker that processes messages from stream and saves to DB.

```javascript
const consumer = new StreamConsumer('worker-1');
await consumer.start();

// Now runs in background:
// 1. Reads from Redis Stream
// 2. Saves to MongoDB
// 3. Acknowledges when done
// 4. Retries on failure
// 5. Moves to DLQ if max retries exceeded
```

**Features:**
- Auto-retry on failure (configurable max attempts)
- Dead Letter Queue (DLQ) for failed messages
- Consumer groups (multiple workers)
- Message acknowledgment (no duplicate processing)

### 3. **ConsumerManager** (`services/consumerManager.js`)

Manages multiple consumer workers.

```javascript
const { getConsumerManager } = require('./services/consumerManager');

const manager = getConsumerManager();
await manager.startConsumers(2); // Start 2 workers

// Can monitor health:
const status = manager.getHealthStatus();
```

---

## Redis Stream Concepts

### **Stream Entry**
```
Stream ID: 1234567890-0
Entry: {
  senderId: "user123",
  conversationId: "conv456",
  content: "Hello!",
  messageId: "msg789",
  timestamp: "2024-01-15T...",
  status: "pending",
  retryCount: "0"
}
```

### **Consumer Groups**

```javascript
// Create consumer group (idempotent)
await redis.xGroupCreate(
  'stream:messages',
  'message-saver-group',
  '0',
  { MKSTREAM: true }
);

// Multiple consumers read from same group
// Each message processed by exactly one consumer
```

### **Pending Acknowledgments (PEL)**

```
Pending Entry List:
- Entry is "pending" until consumer acknowledges
- If consumer crashes, another worker picks it up
- Guarantees "at-least-once" delivery
```

---

## Message Flow Lifecycle

### **1. Message Produced**
```javascript
socket.on('message:send', async (data) => {
  // ⚡ FAST: Produce to stream
  const streamId = await StreamProducer.produceMessage(data);
  
  // ✅ Immediate response
  socket.emit('message:sent', { streamId });
  
  // 📤 Broadcast
  io.to(`conversation:${convId}`).emit('message:received', data);
});
```

**Time: < 10ms**  
**Database: No write yet**

### **2. Consumer Reads from Stream**
```javascript
const messages = await redis.xReadGroup({
  key: 'stream:messages',
  group: 'message-saver-group',
  consumer: 'worker-1'
}, {
  count: 10,
  block: 0 // Wait forever
});
```

**Message enters: PENDING list**

### **3. Consumer Processes Message**
```javascript
// Save to database
const message = new Message(data);
await message.save(); // Can take 100-500ms

// Update conversation
await Conversation.findByIdAndUpdate(...);

// Acknowledge in stream
await redis.xAck(
  'stream:messages',
  'message-saver-group',
  streamId
);
```

**Message removed from: PENDING list**

### **4. Failure Handling**

**If database fails:**
```javascript
try {
  await message.save();
} catch (error) {
  if (retryCount < MAX_RETRIES) {
    // Requeue for retry
    await StreamProducer.produceMessage({
      ...data,
      retryCount: retryCount + 1
    });
  } else {
    // Move to Dead Letter Queue
    await moveToDeadLetterQueue(streamId, data, error);
  }
}
```

---

## Configuration (`config/streams.js`)

```javascript
STREAMS.CONFIG = {
  BATCH_SIZE: 10,           // Read 10 at a time
  READ_TIMEOUT: 0,          // Block forever waiting
  MESSAGE_RETENTION: 3600,  // Keep 1 hour
  MAX_RETRIES: 3,           // Retry 3 times max
};
```

**Tuning:**
- Increase `BATCH_SIZE` for higher throughput (use more memory)
- Decrease `BATCH_SIZE` for lower latency
- Increase `MAX_RETRIES` for unreliable DB
- Adjust `MESSAGE_RETENTION` based on storage

---

## Monitoring & Debugging

### **Stream Statistics**

```javascript
// Get current state
const stats = await StreamProducer.getStreamStats();
console.log(stats);
// {
//   length: 150,           // Messages in stream
//   "first-entry": {...},
//   "last-entry": {...}
// }

// Check pending messages
const length = await StreamProducer.getStreamLength();
console.log(`${length} messages waiting to be processed`);
```

### **Consumer Group Info**

```javascript
const groupInfo = await consumer.getConsumerGroupInfo();
console.log(groupInfo);
// [
//   {
//     "name": "message-saver-group",
//     "consumers": 2,
//     "pending": 5,
//     ...
//   }
// ]
```

### **Pending Messages**

```javascript
const pending = await consumer.getPendingMessages();
pending.forEach(msg => {
  console.log(`Consumer: ${msg.consumerName}, Messages: ${msg.pending}`);
});
```

---

## Performance Comparison

### **Without Redis Streams**

```
100 messages sent over 1 second:

Timeline:
0ms   - Message 1 to DB ────────────────── 200ms
100ms - Message 2 to DB ────────────────── 300ms
        Message 3 to DB ────────────────── 400ms
        Message 4 to DB ────────────────── 500ms (TIMEOUT!)
        Database overloaded 🔥

All users experience lag!
```

### **With Redis Streams**

```
100 messages sent over 1 second:

Timeline:
0ms   - Message 1 → Stream (2ms) ✅
100ms - Message 2 → Stream (2ms) ✅
        Message 3 → Stream (2ms) ✅
        Message 4 → Stream (2ms) ✅

Consumers processing in background:
0-500ms   - Consumer reads batches from stream
500-1000ms - Consumer saves to DB at smooth rate

All users get instant response! ✅
```

---

## Error Scenarios & Recovery

### **Scenario 1: Database is Slow**

```
Producer: Fast ⚡️️
Stream: Buffering messages ⏳
Consumer: Processing slowly 🐢

Result:
✅ Users get instant response
✅ No database crash
✅ Messages eventually saved
✅ Auto-scales with more workers
```

### **Scenario 2: Consumer Crashes**

```
Consumer 1: 🔴 CRASHED (had 5 pending messages)

Redis Stream:
- Keeps pending messages in PEL
- Another consumer picks them up
- Messages NOT lost ✅

Result:
✅ Auto-failover to other workers
✅ No message loss
✅ System recovers automatically
```

### **Scenario 3: Message Fails After Max Retries**

```
Message fails 3 times:
Retry 1: Database connection error ❌
Retry 2: Database connection error ❌
Retry 3: Database connection error ❌

Action:
✅ Move to Dead Letter Queue (DLQ)
✅ Alert administrators
✅ Don't block other messages

Result:
✅ No infinite retry loops
✅ Early problem detection
✅ Debugging data preserved
```

---

## Setup Instructions

### **1. Install Dependencies**
```bash
npm install redis express-session connect-mongo
```

### **2. Start Redis**
```bash
# Docker
docker run -d -p 6379:6379 redis:latest

# Or locally if installed
redis-server
```

### **3. Update server.js**
```javascript
const { getConsumerManager } = require('./services/consumerManager');

// After app setup:
const consumerManager = getConsumerManager();
await consumerManager.startConsumers(2); // Start 2 workers
```

### **4. Update .env**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= # if needed
```

### **5. Test It**

```bash
# Monitor stream
redis-cli
> XLEN stream:messages
> XREAD COUNT 5 STREAMS stream:messages 0
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production` in .env
- [ ] Enable SSL for Redis connections
- [ ] Monitor stream length with alerts
- [ ] Setup DLQ monitoring
- [ ] Configure consumer worker count based on load
- [ ] Setup metrics (Prometheus)
- [ ] Configure log aggregation (ELK)
- [ ] Backup Redis data
- [ ] Test consumer failover scenarios
- [ ] Document runbook for manual intervention

---

## Advanced Topics

### **Multiple Streams (Different Consumer Groups)**

```javascript
// Separate streams for different data types
stream:messages       // Chat messages
stream:events         // User events
stream:notifications  // Push notifications

// Each with own consumer group and workers
```

### **Priority Processing**

```javascript
// High-priority stream processed first
stream:messages:high
stream:messages:normal
stream:messages:low
```

### **Batching Optimization**

```javascript
// Instead of saving 1 message at a time:
const messages = await consumer.readBatch(10);
await Message.insertMany(messages);
// Bulk insert 10x faster!
```

---

## References

- Redis Streams Documentation: https://redis.io/docs/data-types/streams/
- Consumer Groups: https://redis.io/docs/data-types/streams-tutorial/#consumer-groups
- Best Practices: https://raw.githubusercontent.com/antirez/redis/7.0/src/server.c (🤓)

See `socketHandler.js` for live examples!
