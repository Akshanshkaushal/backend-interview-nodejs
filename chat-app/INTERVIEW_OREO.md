# Interview Oreo: Chat Backend Snippets

Minimal code to remember for DM + group chat using this architecture.

## 1. Models

```js
// User
{ name, email, password, isOnline, lastSeen }

// Conversation
{
  type: 'DM' | 'GROUP',
  name,
  members: [userId],
  admin,
  lastMessage
}

// Message
{
  chat,
  sender,
  receiver,
  content,
  mediaUrl,
  type: 'text' | 'image' | 'video',
  status: 'sent' | 'delivered' | 'read',
  readBy: [{ user, readAt }]
}
```

## 2. Routes

```js
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/groups', groupRoutes);
```

```http
POST  /api/v1/messages/send
GET   /api/v1/messages/:userId/:receiverId
GET   /api/v1/users/:userId/chats

POST  /api/v1/groups/create
POST  /api/v1/groups/:groupId/add
GET   /api/v1/groups/:groupId/messages
```

## 3. DM Send Logic

```js
async function getOrCreateDM(userId, receiverId) {
  let chat = await Conversation.findOne({
    type: 'DM',
    members: { $all: [userId, receiverId], $size: 2 },
  });

  if (!chat) {
    chat = await Conversation.create({
      type: 'DM',
      members: [userId, receiverId],
    });
  }

  return chat;
}
```

```js
async function sendMessage({ senderId, receiverId, chatId, content }) {
  const chat = chatId
    ? await Conversation.findById(chatId)
    : await getOrCreateDM(senderId, receiverId);

  const message = await Message.create({
    chat: chat._id,
    sender: senderId,
    receiver: chat.type === 'DM' ? receiverId : null,
    content,
  });

  chat.lastMessage = message._id;
  await chat.save();

  return message;
}
```

## 4. Group Logic

```js
async function createGroup(req, res) {
  const members = [req.userId, ...req.body.memberIds];

  const group = await Conversation.create({
    type: 'GROUP',
    name: req.body.name,
    members,
    admin: req.userId,
  });

  res.status(201).json({ group });
}
```

```js
async function addMember(req, res) {
  const group = await Conversation.findOneAndUpdate(
    { _id: req.params.groupId, type: 'GROUP', admin: req.userId },
    { $addToSet: { members: req.body.userId } },
    { new: true }
  );

  res.json({ group });
}
```

## 5. Socket Auth

```js
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    socket.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
});
```

## 6. Socket Presence

```js
io.on('connection', async (socket) => {
  await redis.set(`presence:${socket.userId}`, socket.id, { EX: 86400 });
  await User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    lastSeen: new Date(),
  });

  io.emit('user:online', { userId: socket.userId });
});
```

## 7. Join Chat Room

```js
socket.on('chat:join', ({ chatId }) => {
  socket.join(`chat:${chatId}`);
});
```

## 8. Realtime Message Send

```js
socket.on('message:send', async (payload, ack) => {
  try {
    const message = await sendMessage({
      senderId: socket.userId,
      receiverId: payload.receiverId,
      chatId: payload.chatId,
      content: payload.content,
    });

    io.to(`chat:${message.chat}`).emit('message:new', message);
    ack?.({ ok: true, message });
  } catch (err) {
    ack?.({ ok: false, error: err.message });
  }
});
```

## 9. Redis Stream Event Log

Use Redis Stream after saving the message. It works like an event log/queue so another worker can process notifications, search indexing, analytics, or retry logic later.

```js
async function addMessageToStream(message) {
  await redis.xAdd('stream:messages', '*', {
    messageId: message._id.toString(),
    chatId: message.chat.toString(),
    senderId: message.sender.toString(),
    receiverId: message.receiver?.toString() || '',
    content: message.content || '',
    type: message.type || 'text',
    createdAt: new Date().toISOString(),
  });
}
```

Call it inside `sendMessage`:

```js
const message = await Message.create({
  chat: chat._id,
  sender: senderId,
  receiver: chat.type === 'DM' ? receiverId : null,
  content,
});

chat.lastMessage = message._id;
await chat.save();

await addMessageToStream(message);

return message;
```

Basic worker idea:

```js
const data = await redis.xRead(
  [{ key: 'stream:messages', id: '$' }],
  { BLOCK: 0 }
);

// worker can send push notification, update search index, etc.
```

## 10. Typing Events

```js
socket.on('typing:start', ({ chatId }) => {
  socket.to(`chat:${chatId}`).emit('typing:start', {
    userId: socket.userId,
    chatId,
  });
});

socket.on('typing:stop', ({ chatId }) => {
  socket.to(`chat:${chatId}`).emit('typing:stop', {
    userId: socket.userId,
    chatId,
  });
});
```

## 11. Disconnect

```js
socket.on('disconnect', async () => {
  await redis.del(`presence:${socket.userId}`);
  await User.findByIdAndUpdate(socket.userId, {
    isOnline: false,
    lastSeen: new Date(),
  });

  io.emit('user:offline', { userId: socket.userId });
});
```

## Interview Flow To Say

```text
Client sends message -> JWT auth -> find/create DM or group chat
-> save Message in MongoDB -> update Conversation.lastMessage
-> XADD event into Redis Stream -> emit message:new to Socket.io room
-> store presence in Redis
-> receiver fetches history with pagination when offline.
```
