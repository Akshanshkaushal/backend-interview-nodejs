const express = require('express');
const router = express.Router();
const {
  createDM,
  createGroup,
  getUserConversations,
  getMessages,
  markAsRead,
} = require('../controllers/chatController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Conversation routes
router.post('/dm', createDM);
router.post('/group', createGroup);
router.get('/conversations', getUserConversations);

// Message routes
router.get('/:conversationId/messages', getMessages);
router.put('/message/:messageId/read', markAsRead);

module.exports = router;
