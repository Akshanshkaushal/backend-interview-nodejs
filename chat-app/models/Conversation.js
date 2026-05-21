const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: null, // null for DM, string for group
    },
    type: {
      type: String,
      enum: ['DM', 'GROUP'],
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
