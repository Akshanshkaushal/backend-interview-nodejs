const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const redisClient = require('../config/redis');
const jwt = require('jsonwebtoken');

// Store active socket connections
const userSockets = new Map(); // userId -> socket

const initializeSocket = (io) => {
  // Middleware to verify JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('User connected:', socket.userId);

    // Store socket connection
    userSockets.set(socket.userId, socket);

    // Store user online status in Redis (with expiry)
    await redisClient.set(`user:${socket.userId}:online`, socket.id, { EX: 86400 });

    // Update user online status in DB
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Broadcast user online status to all connected clients
    io.emit('user:online', { userId: socket.userId });

    // ============ MESSAGE HANDLING ============

    // Send message (DM or Group)
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content } = data;
        const senderId = socket.userId;

        // Create message in database
        const message = new Message({
          sender: senderId,
          conversation: conversationId,
          content,
        });
        await message.save();
        await message.populate('sender', 'name email avatar');

        // Update last message in conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
        });

        // Publish to Redis pub/sub for real-time delivery
        await redisClient.publish(`conversation:${conversationId}`, JSON.stringify({
          type: 'message',
          message: message.toObject(),
        }));

        // Add to Redis Stream for historical record
        await redisClient.xAdd(`stream:conversation:${conversationId}`, '*', {
          senderId: senderId,
          messageId: message._id.toString(),
          content: content,
          timestamp: new Date().toISOString(),
        });

        // Emit to all users in conversation (for WebSocket clients)
        io.to(`conversation:${conversationId}`).emit('message:received', {
          message: message.toObject(),
        });

        socket.emit('message:sent', { success: true, message });
      } catch (error) {
        socket.emit('message:error', { error: error.message });
      }
    });

    // Join conversation room
    socket.on('conversation:join', async (data) => {
      try {
        const { conversationId } = data;
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);

        // Subscribe to Redis pub/sub for this conversation
        const subscriber = redisClient.duplicate();
        await subscriber.connect();
        await subscriber.subscribe(`conversation:${conversationId}`, (message) => {
          const data = JSON.parse(message);
          socket.emit('message:received', data);
        });
      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // ============ TYPING STATUS ============

    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      io.to(`conversation:${conversationId}`).emit('user:typing', {
        userId: socket.userId,
      });
    });

    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      io.to(`conversation:${conversationId}`).emit('user:stopped-typing', {
        userId: socket.userId,
      });
    });

    // ============ ONLINE STATUS ============

    // Get online users
    socket.on('users:getOnline', async () => {
      try {
        const keys = await redisClient.keys('user:*:online');
        const onlineUserIds = keys
          .map((key) => key.split(':')[1])
          .filter((id) => id !== socket.userId);

        const onlineUsers = await User.find(
          { _id: { $in: onlineUserIds } },
          'name email avatar'
        );

        socket.emit('users:online', onlineUsers);
      } catch (error) {
        socket.emit('error', { error: error.message });
      }
    });

    // ============ DISCONNECT ============

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.userId);

      // Remove from socket map
      userSockets.delete(socket.userId);

      // Remove from Redis
      await redisClient.del(`user:${socket.userId}:online`);

      // Update user status in DB
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Broadcast user offline status
      io.emit('user:offline', { userId: socket.userId });
    });
  });
};

module.exports = { initializeSocket, userSockets };
