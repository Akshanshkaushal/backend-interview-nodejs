# Chat App Backend Architecture

## Requirements

- Register and login users
- One-to-one messaging
- Group messaging
- Text, image, and video message metadata
- Message history with pagination
- Online status and last seen
- Delivery/read receipts

## High Level Design

```text
Client
  | REST
  v
LB / API Gateway
  | auth, routing, rate limiting
  v
Express API
  |-- User routes    -> User controller    -> User DB
  |-- Message routes -> Message controller -> Chat DB + Redis Stream
  |-- Group routes   -> Group controller   -> Group DB

Client
  | WebSocket
  v
Socket Gateway
  |-- auth
  |-- room routing by chatId
  |-- online/offline events
  |-- typing events
  v
Redis presence + MongoDB messages
```

## Low Level Components

- `server.js`: Express app, Socket.io server, route mounting
- `middleware/gateway.js`: API gateway layer for request id and rate limiting
- `models/`: MongoDB schemas for users, chats, and messages
- `controllers/`: Thin request/response layer
- `services/messageService.js`: Core chat business logic
- `utils/socketHandler.js`: WebSocket gateway for auth, rooms, realtime message events
- `config/redis.js`: Presence TTL and Redis Stream client

## Gateway In This Repo

```text
External production system:
Client -> Nginx / AWS ALB / API Gateway -> Node service

Interview/local code:
Client -> Express gateway middleware -> /api/v1 routes
Client -> Socket.io gateway handler -> chat rooms
```

Code locations:

- REST gateway: `middleware/gateway.js`
- Rate limiting: `middleware/rateLimiter.js`
- WebSocket gateway: `utils/socketHandler.js`

## API Routes

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

## Message Flow

```text
1. Client sends message by REST or socket event.
2. Auth middleware identifies sender from JWT.
3. Message service finds or creates the DM chat.
4. Message is saved to MongoDB.
5. Conversation lastMessage is updated.
6. Message event is appended to Redis Stream.
7. Socket.io emits message:new to the chat room and online receiver.
8. Receiver marks read with PATCH /api/v1/messages/:messageId/read.
```

## Interview Scaling Notes

- Use Redis Cluster for presence and message stream.
- Use sticky sessions or a Socket.io Redis adapter behind a load balancer.
- Shard messages by `chatId` when chat volume grows.
- Store media in S3/CDN and keep only `mediaUrl` in MongoDB.
- Add rate limiting at the gateway for login and message sends.
