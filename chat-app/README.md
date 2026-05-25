# Chat App Backend

Interview-ready backend for a Messenger/WhatsApp-style chat app.

## Architecture

```
client -> LB/API Gateway -> Express routes
client -> WebSocket Gateway -> Socket.io chat server

Express routes:
  gateway middleware -> request id + rate limit
  users service    -> MongoDB users
  message service  -> MongoDB conversations/messages
  group service    -> MongoDB conversations

Realtime:
  Socket.io rooms per chat
  Redis stores user presence with TTL
  Redis Streams keep a lightweight message event log
```

## Core Entities

- `User`: name, email, phone, avatar, online status, last seen
- `Conversation`: DM or GROUP, members, admin, last message
- `Message`: chat, sender, receiver, content/media, type, delivery/read state

## Routes

```http
POST  /api/v1/users/register
POST  /api/v1/users/login
GET   /api/v1/users/online
GET   /api/v1/users/:userId/chats?page=1&limit=20

POST  /api/v1/messages/send
GET   /api/v1/messages/:userId/:receiverId?page=1&limit=30
PATCH /api/v1/messages/:messageId/read

POST  /api/v1/groups/create
POST  /api/v1/groups/:groupId/add
POST  /api/v1/groups/:groupId/remove
GET   /api/v1/groups/:groupId/messages?page=1&limit=30
```

## WebSocket Events

```js
socket.emit('chat:join', { chatId });
socket.emit('message:send', { chatId, receiverId, content, mediaUrl, type }, ack);
socket.emit('typing:start', { chatId });
socket.emit('typing:stop', { chatId });

socket.on('message:new', handler);
socket.on('user:online', handler);
socket.on('user:offline', handler);
```

## Run

```bash
npm install
npm run dev
```

Required `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chat-app
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=change-this
```
