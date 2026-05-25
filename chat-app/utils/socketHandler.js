const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redisClient = require('../config/redis');
const messageService = require('../services/messageService');

const onlineUsers = new Map();

const setPresence = async (userId, socketId) => {
  onlineUsers.set(userId, socketId);
  if (redisClient.isOpen) {
    await redisClient.set(`presence:${userId}`, socketId, { EX: 86400 });
  }
  await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
};

const clearPresence = async (userId) => {
  onlineUsers.delete(userId);
  if (redisClient.isOpen) {
    await redisClient.del(`presence:${userId}`);
  }
  await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
};

const initializeSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error('Token missing');

      socket.userId = jwt.verify(token, process.env.JWT_SECRET).id;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    await setPresence(socket.userId, socket.id);
    io.emit('user:online', { userId: socket.userId });

    socket.on('chat:join', ({ chatId }) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        const message = await messageService.sendMessage({
          senderId: socket.userId,
          receiverId: payload.receiverId,
          chatId: payload.chatId,
          content: payload.content,
          mediaUrl: payload.mediaUrl,
          type: payload.type,
        });

        io.to(`chat:${message.chat}`).emit('message:new', message);

        if (message.receiver) {
          const receiverSocketId = onlineUsers.get(message.receiver.toString());
          if (receiverSocketId) io.to(receiverSocketId).emit('message:new', message);
        }

        if (ack) ack({ ok: true, message });
      } catch (error) {
        if (ack) ack({ ok: false, error: error.message });
        socket.emit('message:error', { message: error.message });
      }
    });

    socket.on('typing:start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:start', { userId: socket.userId, chatId });
    });

    socket.on('typing:stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', { userId: socket.userId, chatId });
    });

    socket.on('disconnect', async () => {
      await clearPresence(socket.userId);
      io.emit('user:offline', { userId: socket.userId });
    });
  });

  return io;
};

module.exports = { initializeSocket };
