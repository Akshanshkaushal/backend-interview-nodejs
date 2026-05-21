# Chat App - Architecture & System Design

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser/App)                    │
│                  Socket.io WebSocket Client                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │ Socket.io Server│
                   │  (Port 5000)    │
                   └────────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼──┐            ┌───▼──┐           ┌───▼──┐
    │MongoDB│            │ Redis │          │ Logger
    │ (1:M) │            │ (PubSub)         │
    └───────┘            └───────┘          └──────┘
        │                   │
    Messages          Online Status
    Conversations     Streams
    Users             Caching
```

## 📊 Data Models & Relationships

```
User (1 : Many) Message
User (Many : Many) Conversation
Conversation (1 : Many) Message
```

### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Schema
```javascript
{
  _id: ObjectId,
  name: String (null for DM),
  type: 'DM' | 'GROUP',
  members: [ObjectId], // User references
  admin: ObjectId, // Group admin
  lastMessage: ObjectId, // Message reference
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Schema
```javascript
{
  _id: ObjectId,
  sender: ObjectId, // User reference
  conversation: ObjectId, // Conversation reference
  content: String,
  isRead: Boolean,
  readBy: [{
    user: ObjectId,
    readAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔄 Message Flow

### Sending a Message

```
┌─────────┐
│ Client  │
│ (Alice) │
└────┬────┘
     │ socket.emit('message:send', {conversationId, content})
     │
     ▼
┌─────────────────────────────┐
│   Socket.io Handler         │
│ - Extract sender ID         │
│ - Validate conversation     │
└────┬────────────────────────┘
     │
     ├─► Save to MongoDB (Message collection)
     │
     ├─► Publish to Redis Pub/Sub (conversation:ID)
     │
     ├─► Add to Redis Stream (stream:conversation:ID)
     │
     └─► Emit to all clients in conversation
         via io.to('conversation:ID').emit()
```

### Receiving a Message

```
┌──────────────────────────┐
│ Redis Pub/Sub Subscriber │
│ (listening on topic)     │
└────┬─────────────────────┘
     │
     ▼
┌────────────────────────────┐
│ Broadcast to all connected │
│ clients in this room       │
│ via Socket.io              │
└────┬─────────────────────┘
     │
     ├─► Client 1 (Bob) receives in real-time
     ├─► Client 2 (Charlie) receives in real-time
     └─► Offline users will fetch when online
```

## 🔌 WebSocket Events Flow

```
CLIENT → SERVER                      SERVER → CLIENT
────────────────────────────────────────────────────

message:send                         ┐
  ↓                                  │
message:received (persisted)         │
  ↓                                  │
confirm message:sent        ←────────┘

conversation:join                    ┐
  ↓                                  │
subscribe to Redis Pub/Sub  ←────────┘

typing:start                         ┐
  ↓                                  │
broadcast to room           ←────────┤
  ↓                                  │
user:typing emitted                  │
                                     │
typing:stop                          │
  ↓                                  │
user:stopped-typing        ←────────┘

users:getOnline                      ┐
  ↓                                  │
fetch from Redis            ←────────┤
  ↓                                  │
users:online emitted                 │
                                     │
user:online (disconnect event)       │
user:offline (disconnect event)  ←──┘
```

## 🔐 Authentication Flow

```
REGISTER/LOGIN
    │
    ▼
Password Hash (bcrypt)
    │
    ▼
Save User to MongoDB
    │
    ▼
Generate JWT Token
    │
    ▼
Return Token to Client
    │
    ▼ Client stores token in localStorage
    │
Client uses token for:
├─► REST API: Authorization: Bearer <token>
└─► WebSocket: auth: { token: <token> }
    │
    ▼
JWT Verification Middleware
    │
    ▼
Extract user ID from payload
    │
    ▼
Attach to request/socket
```

## 💾 Redis Usage

### 1. Online Status Storage
```
KEY: user:userId:online
VALUE: socket_id
TTL: 24 hours (86400 seconds)

COMMANDS:
SET user:123:online "socket-abc" EX 86400
KEYS "user:*:online"
DEL user:123:online
```

### 2. Pub/Sub for Message Broadcasting
```
CHANNEL: conversation:conversationId

Publisher (when message sent):
PUBLISH conversation:123 '{"type":"message","message":{...}}'

Subscriber (listening clients):
SUBSCRIBE conversation:123
Message received → Forward to all clients in room
```

### 3. Redis Streams for Message History
```
KEY: stream:conversation:conversationId

ADD MESSAGE:
XADD stream:conversation:123 * \
  senderId "user-id" \
  messageId "msg_id" \
  content "Hello" \
  timestamp "2024-05-22T10:00:00Z"

READ HISTORY:
XREAD STREAMS stream:conversation:123 0
XRANGE stream:conversation:123 - +
```

## 🔄 Scalability Considerations

### Current Single-Server Setup
```
┌────────────────────┐
│   Single Server    │
│   - Express        │
│   - Socket.io      │
│   - Redis (local)  │
└────────────────────┘
       │
    ┌──┴──┐
    │     │
MongoDB  Redis
```

### Scaled Multi-Server Setup
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Server 1   │  │   Server 2   │  │   Server 3   │
│  Express+S.io│  │  Express+S.io│  │  Express+S.io│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       ┌──▼──┐    ┌─────▼──────┐   ┌──▼────┐
       │Redis│───▼Pub/Sub Cluster  │Kafka │
       │Cluster          │         └──────┘
       └─────┘    └──────┬───────┘
              Shared State & Events
                    │
        ┌───────────┴───────────┐
        │                       │
     MongoDB               Persistent
     Cluster              Event Log
```

## 📈 Performance Optimization

### 1. Database Indexing
```javascript
// Create indexes in MongoDB
user.email (unique index for fast login)
message.conversation (for querying messages)
message.createdAt (for sorting)
conversation.members (for finding user's conversations)
```

### 2. Message Pagination
```javascript
// Instead of loading all messages:
GET /api/chat/:conversationId/messages?limit=50&skip=0

// Load more with:
GET /api/chat/:conversationId/messages?limit=50&skip=50
```

### 3. Caching Strategy
```
Redis Cache Layers:
├─ Online status (user:ID:online)
├─ User sessions
├─ Recent messages (optional)
└─ Metadata
```

### 4. Connection Pooling
```
MongoDB Connection Pool (maintained by Mongoose)
Redis Connection (single connection with pub/sub)
```

## 🛡️ Security Features

### 1. Authentication
- JWT tokens with expiration
- Password hashing (bcryptjs)
- Token verification on every API call

### 2. Authorization
- Users can only see own conversations
- Group members can only access group
- Admin-only group operations (future)

### 3. Input Validation
- Mongoose schema validation
- Type checking before DB operations

### 4. CORS
- Configured to allow specified origins
- Prevents unauthorized cross-origin requests

## 📊 Database Query Patterns

### Find User's Conversations (Most Common)
```javascript
// Optimized query
Conversation.find({ members: userId })
  .populate('lastMessage')
  .populate('members', 'name email avatar isOnline')
  .sort({ updatedAt: -1 })
```

### Get Messages with Pagination
```javascript
Message.find({ conversation: conversationId })
  .populate('sender', 'name email avatar')
  .limit(50)
  .skip(skip)
  .sort({ createdAt: -1 })
```

### Get Online Users
```javascript
// Using Redis (faster than DB query)
redis.keys('user:*:online') → Extract userIds
User.find({ _id: { $in: userIds } })
```

## 🔍 Error Handling Flow

```
TRY BLOCK
    │
    ├─ Validate input
    ├─ Database operation
    ├─ Redis operation
    ├─ Message broadcast
    │
    └─► SUCCESS ✓
         └─ Send response/emit success
    
CATCH BLOCK
    │
    ├─ Log error
    ├─ Send error response
    └─► FAILURE ✗
```

## 🧪 Testing Strategy

### Unit Tests
```javascript
// Test individual functions
- Password hashing
- JWT token generation
- Message validation
```

### Integration Tests
```javascript
// Test API endpoints
- POST /api/users/register
- POST /api/chat/dm
- GET /api/chat/conversations
```

### E2E Tests
```javascript
// Test complete user flows
- Register → Login → Create DM → Send Message
- Create Group → Add Members → Send Message
```

## 📝 Summary - Key Interview Points

1. **Architecture**: Modular, scalable, follows MVC pattern
2. **Real-time**: Socket.io for instant communication
3. **Performance**: Redis for caching and pub/sub, MongoDB for storage
4. **Security**: JWT authentication, password hashing
5. **Scalability**: Can be deployed on multiple servers with Redis cluster
6. **Database Design**: Proper relationships and indexing
7. **Error Handling**: Comprehensive try-catch and error responses
8. **Code Organization**: Clean separation of concerns (models, controllers, routes)

---

This architecture supports:
- ✅ Real-time messaging
- ✅ Multiple conversations (1:1 and groups)
- ✅ Online status tracking
- ✅ Message persistence
- ✅ Horizontal scaling
- ✅ Production deployment
