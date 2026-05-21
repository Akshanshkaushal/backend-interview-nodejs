# Minimal Chat App Server

A production-ready chat application built with **Express**, **Socket.io**, **Redis**, and **MongoDB**. Designed for interviews to demonstrate real-time communication, DM & group functionality, online status tracking, and scalable architecture.

## 🚀 Features

- **Direct Messages (DM)** - One-to-one conversations
- **Group Chat** - Multi-user conversations with admin controls
- **Real-time Messaging** - Socket.io for instant message delivery
- **Online Status** - Track user online/offline status using Redis
- **Redis Pub/Sub** - Real-time message broadcasting
- **Redis Streams** - Message history and event logging
- **Typing Indicators** - Show when users are typing
- **Message Read Status** - Track which users read messages
- **JWT Authentication** - Secure user sessions
- **Scalable Architecture** - Clean separation: Models, Controllers, Routes

## 📁 Project Structure

```
chat-app/
├── config/
│   ├── db.js              # MongoDB connection
│   └── redis.js           # Redis client setup
├── models/
│   ├── User.js            # User schema
│   ├── Message.js         # Message schema
│   └── Conversation.js    # DM & Group schema
├── controllers/
│   ├── userController.js  # Auth & user logic
│   └── chatController.js  # Chat & conversation logic
├── routes/
│   ├── userRoutes.js      # User endpoints
│   └── chatRoutes.js      # Chat endpoints
├── middleware/
│   └── auth.js            # JWT authentication
├── utils/
│   └── socketHandler.js   # WebSocket handlers
├── server.js              # Express & Socket.io setup
├── .env                   # Environment variables
└── package.json           # Dependencies
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud)
- Redis (local or cloud)

### Installation

```bash
cd chat-app
npm install
```

### Environment Variables
Create a `.env` file:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key_change_this
NODE_ENV=development
```

### Start Server

```bash
npm start          # Production
npm run dev        # Development (with nodemon)
```

## 📚 API Endpoints

### Authentication

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### Get Online Users
```http
GET /api/users/online
Authorization: Bearer token

Response:
[
  {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isOnline": true,
    "avatar": "url"
  }
]
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer token

Response:
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "isOnline": true,
  "lastSeen": "2024-05-22T10:00:00Z"
}
```

### Chat Conversations

#### Create DM Conversation
```http
POST /api/chat/dm
Authorization: Bearer token
Content-Type: application/json

{
  "recipientId": "recipient_user_id"
}

Response:
{
  "message": "DM created",
  "conversation": {
    "_id": "conversation_id",
    "type": "DM",
    "members": ["user_id", "recipient_id"]
  }
}
```

#### Create Group Conversation
```http
POST /api/chat/group
Authorization: Bearer token
Content-Type: application/json

{
  "name": "Project Discussion",
  "memberIds": ["user_id_2", "user_id_3"]
}

Response:
{
  "message": "Group created",
  "conversation": {
    "_id": "conversation_id",
    "type": "GROUP",
    "name": "Project Discussion",
    "members": ["user_id", "user_id_2", "user_id_3"],
    "admin": "user_id"
  }
}
```

#### Get User Conversations
```http
GET /api/chat/conversations
Authorization: Bearer token

Response:
[
  {
    "_id": "conversation_id",
    "type": "DM",
    "members": [{ name: "John", email: "john@..." }, ...],
    "lastMessage": { _id: "msg_id", content: "..." },
    "updatedAt": "2024-05-22T10:00:00Z"
  }
]
```

#### Get Messages
```http
GET /api/chat/:conversationId/messages?limit=50&skip=0
Authorization: Bearer token

Response:
[
  {
    "_id": "message_id",
    "sender": { name: "John", email: "john@..." },
    "content": "Hello!",
    "createdAt": "2024-05-22T10:00:00Z",
    "readBy": []
  }
]
```

#### Mark Message as Read
```http
PUT /api/chat/message/:messageId/read
Authorization: Bearer token

Response:
{
  "message": "Message marked as read",
  "message": { ... }
}
```

## 🔌 WebSocket Events

### Client to Server

```javascript
// Connect with token
const socket = io('http://localhost:5000', {
  auth: { token: 'jwt_token_here' }
});

// Send message
socket.emit('message:send', {
  conversationId: 'conv_id',
  content: 'Hello everyone!'
});

// Join conversation
socket.emit('conversation:join', { conversationId: 'conv_id' });

// Leave conversation
socket.emit('conversation:leave', { conversationId: 'conv_id' });

// Show typing status
socket.emit('typing:start', { conversationId: 'conv_id' });
socket.emit('typing:stop', { conversationId: 'conv_id' });

// Get online users
socket.emit('users:getOnline');
```

### Server to Client

```javascript
// Receive message
socket.on('message:received', (data) => {
  console.log('New message:', data.message);
});

// Message sent confirmation
socket.on('message:sent', (data) => {
  console.log('Message sent successfully');
});

// User online
socket.on('user:online', (data) => {
  console.log('User came online:', data.userId);
});

// User offline
socket.on('user:offline', (data) => {
  console.log('User went offline:', data.userId);
});

// User is typing
socket.on('user:typing', (data) => {
  console.log('User is typing:', data.userId);
});

// User stopped typing
socket.on('user:stopped-typing', (data) => {
  console.log('User stopped typing:', data.userId);
});

// Online users list
socket.on('users:online', (users) => {
  console.log('Online users:', users);
});
```

## 💡 Key Interview Concepts

### 1. **Real-time Communication**
- Socket.io for WebSocket-based real-time messaging
- Two-way communication between client and server

### 2. **Scalability with Redis**
- **Pub/Sub**: Broadcast messages to multiple subscribers
- **Streams**: Store message history for recovery
- **Online Status**: Track user presence with TTL

### 3. **Database Design**
- Mongoose schemas for MongoDB
- References between collections (User, Message, Conversation)
- Proper indexing for queries

### 4. **Authentication & Authorization**
- JWT for stateless authentication
- Middleware for protected routes
- Socket.io authentication middleware

### 5. **Clean Architecture**
- **Models**: Data schemas
- **Controllers**: Business logic
- **Routes**: API endpoints
- **Middleware**: Cross-cutting concerns
- **Utils**: Helper functions

### 6. **Error Handling**
- Try-catch in async operations
- Proper HTTP status codes
- Error event emission in WebSocket

## 🧪 Testing with Postman/cURL

### Register & Get Token
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@example.com",
    "password": "pass123"
  }'
```

### Get Conversations
```bash
curl -X GET http://localhost:5000/api/chat/conversations \
  -H "Authorization: Bearer <your-token>"
```

## 📝 Notes

- Redis Pub/Sub is used for real-time message broadcasting across multiple server instances
- Redis Streams store messages for historical retrieval and auditing
- JWT tokens expire in 7 days by default
- Typing indicators are emitted to all users in a conversation
- Online status has a 24-hour TTL in Redis

## 🎯 Interview Talking Points

1. **How would you scale this for millions of users?**
   - Use Redis cluster for Pub/Sub
   - Implement Kafka for event streaming
   - Load balance WebSocket servers
   - Use MongoDB sharding

2. **How do you handle message ordering?**
   - Timestamps and MongoDB ObjectId
   - Redis Streams maintain insertion order

3. **How is data consistency maintained?**
   - Atomic database writes
   - Transactional operations for multi-step processes

4. **How do you handle offline users?**
   - Store messages in database
   - Deliver when user comes online

5. **What about privacy & security?**
   - JWT authentication
   - Input validation
   - SQL injection prevention (Mongoose escaping)
   - Rate limiting (can be added with express-rate-limit)

## 📦 Dependencies

- **express**: Web framework
- **socket.io**: Real-time communication
- **mongoose**: MongoDB ODM
- **redis**: Caching & Pub/Sub
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **cors**: Cross-origin requests
- **dotenv**: Environment variables

## 🚀 Next Steps

- Add rate limiting
- Implement message encryption
- Add file uploads
- Implement read receipts
- Add user blocking/muting
- Implement message reactions
- Add scheduled messages

---

**Created for Interview Preparation** ✅
