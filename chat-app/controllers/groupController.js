const Conversation = require('../models/Conversation');
const messageService = require('../services/messageService');

const create = async (req, res, next) => {
  try {
    const members = Array.from(new Set([req.userId, ...(req.body.memberIds || [])]));
    const group = await Conversation.create({
      name: req.body.name,
      description: req.body.description || null,
      type: 'GROUP',
      members,
      admin: req.userId,
    });

    res.status(201).json({ group });
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const group = await Conversation.findOneAndUpdate(
      { _id: req.params.groupId, type: 'GROUP', admin: req.userId },
      { $addToSet: { members: req.body.userId } },
      { new: true }
    );

    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ group });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const group = await Conversation.findOneAndUpdate(
      { _id: req.params.groupId, type: 'GROUP', admin: req.userId },
      { $pull: { members: req.body.userId } },
      { new: true }
    );

    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json({ group });
  } catch (error) {
    next(error);
  }
};

const messages = async (req, res, next) => {
  try {
    const group = await Conversation.findOne({
      _id: req.params.groupId,
      type: 'GROUP',
      members: req.userId,
    });

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const groupMessages = await messageService.listChatMessages(group._id, req.query);
    res.json({ messages: groupMessages });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  addMember,
  removeMember,
  messages,
};
