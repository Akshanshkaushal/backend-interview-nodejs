const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const redisClient = require('../config/redis');

// Create DM conversation
const createDM = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.userId;

    // Check if DM already exists
    let conversation = await Conversation.findOne({
      type: 'DM',
      members: { $all: [userId, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        type: 'DM',
        members: [userId, recipientId],
      });
      await conversation.save();
    }

    res.status(201).json({ message: 'DM created', conversation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create DM', error: error.message });
  }
};

// Create group conversation
const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const userId = req.userId;

    const conversation = new Conversation({
      name,
      type: 'GROUP',
      members: [userId, ...memberIds],
      admin: userId,
    });

    await conversation.save();
    res.status(201).json({ message: 'Group created', conversation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create group', error: error.message });
  }
};

// Get user conversations
const getUserConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const conversations = await Conversation.find({ members: userId })
      .populate('lastMessage')
      .populate('members', 'name email avatar isOnline')
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
  }
};

// Get messages in a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email avatar')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    res.status(200).json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        $addToSet: {
          readBy: { user: userId, readAt: new Date() },
        },
      },
      { new: true }
    );

    res.status(200).json({ message: 'Message marked as read', message });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark message as read', error: error.message });
  }
};

module.exports = {
  createDM,
  createGroup,
  getUserConversations,
  getMessages,
  markAsRead,
};
