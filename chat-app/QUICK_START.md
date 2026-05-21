/**
 * QUICK START GUIDE - CHAT APP
 * Step-by-step instructions for running and testing the chat app
 */

// ============ STEP 1: INSTALL DEPENDENCIES ============
// npm install

// ============ STEP 2: START REDIS & MONGODB ============

// Redis (ensure running on localhost:6379)
// Command: redis-server

// MongoDB (ensure running on localhost:27017)
// Command: mongod

// ============ STEP 3: START SERVER ============
// npm start
// Server will run on http://localhost:5000

// ============ STEP 4: TEST API ENDPOINTS ============

// 4.1 Register User 1
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "password123"
}

// Expected Response:
// {
//   "message": "User registered successfully",
//   "token": "eyJhbGc...",
//   "user": { "id": "...", "name": "Alice Johnson", "email": "alice@example.com" }
// }
// Save token as TOKEN_ALICE

---

// 4.2 Register User 2
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "name": "Bob Smith",
  "email": "bob@example.com",
  "password": "password123"
}
// Save token as TOKEN_BOB and userId as USERID_BOB

---

// 4.3 Login with Alice
POST http://localhost:5000/api/users/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "password123"
}

---

// 4.4 Get Online Users
GET http://localhost:5000/api/users/online
Authorization: Bearer TOKEN_ALICE

---

// 4.5 Create DM Between Alice and Bob
POST http://localhost:5000/api/chat/dm
Authorization: Bearer TOKEN_ALICE
Content-Type: application/json

{
  "recipientId": "USERID_BOB"
}

// Expected Response with conversation ID (CONV_ID_DM)
// {
//   "message": "DM created",
//   "conversation": {
//     "_id": "...",
//     "type": "DM",
//     "members": ["alice_id", "bob_id"]
//   }
// }

---

// 4.6 Create Group Chat
POST http://localhost:5000/api/chat/group
Authorization: Bearer TOKEN_ALICE
Content-Type: application/json

{
  "name": "Dev Team",
  "memberIds": ["USERID_BOB"]
}

// Expected Response with conversation ID (CONV_ID_GROUP)

---

// 4.7 Get All Conversations
GET http://localhost:5000/api/chat/conversations
Authorization: Bearer TOKEN_ALICE

// Expected Response: Array of DM and group conversations

---

// 4.8 Get Messages from Conversation (initially empty)
GET http://localhost:5000/api/chat/CONV_ID_DM/messages
Authorization: Bearer TOKEN_ALICE

---

// ============ STEP 5: TEST WEBSOCKET REAL-TIME MESSAGING ============

// Use Socket.io client or socket.io-client library

// Terminal 1 - Frontend/Client for Alice:
const socket1 = io('http://localhost:5000', {
  auth: { token: 'TOKEN_ALICE' }
});

socket1.on('connect', () => console.log('Alice connected'));

socket1.emit('conversation:join', { conversationId: 'CONV_ID_DM' });

socket1.on('message:received', (data) => {
  console.log('Alice received:', data.message.content);
});

---

// Terminal 2 - Frontend/Client for Bob:
const socket2 = io('http://localhost:5000', {
  auth: { token: 'TOKEN_BOB' }
});

socket2.on('connect', () => console.log('Bob connected'));

socket2.emit('conversation:join', { conversationId: 'CONV_ID_DM' });

socket2.on('message:received', (data) => {
  console.log('Bob received:', data.message.content);
});

---

// Now send message from Alice
socket1.emit('message:send', {
  conversationId: 'CONV_ID_DM',
  content: 'Hello Bob, this is Alice!'
});

// Bob should receive the message in real-time
// Output: "Bob received: Hello Bob, this is Alice!"

---

// ============ STEP 6: TEST ONLINE STATUS ============

// Check online users
socket1.emit('users:getOnline');

socket1.on('users:online', (users) => {
  console.log('Online users:', users);
});

// When Bob connects, Alice should see him online:
socket1.on('user:online', (data) => {
  console.log('User came online:', data.userId);
});

// When Bob disconnects:
socket1.on('user:offline', (data) => {
  console.log('User went offline:', data.userId);
});

---

// ============ STEP 7: TEST TYPING INDICATORS ============

socket1.emit('typing:start', { conversationId: 'CONV_ID_DM' });

socket2.on('user:typing', (data) => {
  console.log('User typing:', data.userId);
});

socket1.emit('typing:stop', { conversationId: 'CONV_ID_DM' });

socket2.on('user:stopped-typing', (data) => {
  console.log('User stopped typing:', data.userId);
});

---

// ============ TESTING CHECKLIST ============

✅ User Registration - Creates user in MongoDB
✅ User Login - Returns JWT token
✅ Get online users - Returns users with isOnline=true
✅ Create DM - Creates conversation with type="DM"
✅ Create Group - Creates conversation with type="GROUP"
✅ Get Conversations - Returns all user's conversations
✅ WebSocket Connection - Connects with token auth
✅ Send Message - Message persists in MongoDB + Redis Stream
✅ Receive Message - Real-time delivery via Socket.io
✅ Online Status - Shows online/offline status
✅ Typing Indicators - Shows who is typing
✅ Message Read Status - Tracks read receipts
✅ Redis Pub/Sub - Broadcasting to multiple subscribers
✅ Redis Streams - Historical message storage

---

// ============ DEBUGGING TIPS ============

// Check logs
- Check server console for WebSocket connections
- Check Redis: redis-cli KEYS "user:*:online"
- Check MongoDB: db.messages.find()

// Common Issues:
- "Cannot connect to Redis" → Start redis-server
- "Cannot connect to MongoDB" → Start mongod
- "CORS error" → cors middleware is configured
- "Token invalid" → Check JWT secret in .env
- "WebSocket not connecting" → Check socket.io version and auth token

// Monitor Redis
redis-cli
> KEYS user:*:online
> KEYS stream:conversation:*
> XREAD STREAMS stream:conversation:ID 0

---

// ============ PRODUCTION CHECKLIST ============

- [ ] Update .env with production values
- [ ] Enable HTTPS for Socket.io
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add input validation (joi)
- [ ] Add message encryption
- [ ] Set up Redis cluster for scalability
- [ ] Add database backups
- [ ] Implement message pagination
- [ ] Add file upload support
- [ ] Add message reactions/emojis
- [ ] Add user blocking/muting
- [ ] Add message search
- [ ] Add admin moderation tools
- [ ] Set up logging (winston)
- [ ] Add monitoring/alerting

---

Made for Interview Preparation ✅
