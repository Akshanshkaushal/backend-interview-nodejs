const messageService = require('../services/messageService');

const send = async (req, res, next) => {
  try {
    const message = await messageService.sendMessage({
      senderId: req.userId,
      receiverId: req.body.receiverId,
      chatId: req.body.chatId,
      content: req.body.content,
      mediaUrl: req.body.mediaUrl,
      type: req.body.type,
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

const getUserChats = async (req, res, next) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ message: 'Cannot read another user chats' });
    }

    const chats = await messageService.listUserChats(req.userId, req.query);
    res.json({ chats });
  } catch (error) {
    next(error);
  }
};

const getDirectMessages = async (req, res, next) => {
  try {
    if (req.params.userId !== req.userId) {
      return res.status(403).json({ message: 'Cannot read another user messages' });
    }

    const messages = await messageService.listDirectMessages(
      req.userId,
      req.params.receiverId,
      req.query
    );

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const message = await messageService.markAsRead(req.params.messageId, req.userId);
    res.json({ message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  send,
  getUserChats,
  getDirectMessages,
  markRead,
};
