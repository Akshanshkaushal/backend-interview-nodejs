const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const StreamProducer = require('./streamProducer');

const toInt = (value, fallback) => Math.max(parseInt(value, 10) || fallback, 1);

async function getOrCreateDM(userId, receiverId) {
  if (!receiverId) {
    const error = new Error('receiverId is required for direct messages');
    error.status = 400;
    throw error;
  }

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

async function sendMessage({ senderId, receiverId, chatId, content, mediaUrl, type = 'text' }) {
  if (!content?.trim() && !mediaUrl) {
    const error = new Error('Message content or mediaUrl is required');
    error.status = 400;
    throw error;
  }

  const chat = chatId
    ? await Conversation.findById(chatId)
    : await getOrCreateDM(senderId, receiverId);

  if (!chat) {
    const error = new Error('Chat not found');
    error.status = 404;
    throw error;
  }

  if (!chat.members.some((member) => member.toString() === senderId.toString())) {
    const error = new Error('You are not a member of this chat');
    error.status = 403;
    throw error;
  }

  const dmReceiver = chat.type === 'DM'
    ? receiverId || chat.members.find((id) => id.toString() !== senderId.toString())
    : null;

  const message = await Message.create({
    chat: chat._id,
    sender: senderId,
    receiver: dmReceiver,
    content,
    mediaUrl,
    type,
  });

  chat.lastMessage = message._id;
  await chat.save();
  
  await StreamProducer.produceMessage({
    senderId,
    receiverId,
    chatId: chat._id,
    content,
    mediaUrl,
    type,
  });

  return message.populate('sender', 'name email avatar');
}

async function listUserChats(userId, { page = 1, limit = 20 }) {
  const skip = (toInt(page, 1) - 1) * toInt(limit, 20);

  return Conversation.find({ members: userId })
    .populate('members', 'name email avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(toInt(limit, 20));
}

async function listChatMessages(chatId, { page = 1, limit = 30 }) {
  const skip = (toInt(page, 1) - 1) * toInt(limit, 30);

  const messages = await Message.find({ chat: chatId })
    .populate('sender', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(toInt(limit, 30));

  return messages.reverse();
}

async function listDirectMessages(userId, receiverId, query) {
  const chat = await Conversation.findOne({
    type: 'DM',
    members: { $all: [userId, receiverId], $size: 2 },
  });

  if (!chat) return [];
  return listChatMessages(chat._id, query);
}

async function markAsRead(messageId, userId) {
  return Message.findByIdAndUpdate(
    messageId,
    {
      status: 'read',
      $addToSet: { readBy: { user: userId, readAt: new Date() } },
    },
    { new: true }
  );
}

module.exports = {
  sendMessage,
  listUserChats,
  listChatMessages,
  listDirectMessages,
  markAsRead,
};
