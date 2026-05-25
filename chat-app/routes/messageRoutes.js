const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { send, getDirectMessages, markRead } = require('../controllers/messageController');

router.use(auth);

router.post('/send', send);
router.get('/:userId/:receiverId', getDirectMessages);
router.patch('/:messageId/read', markRead);

module.exports = router;
