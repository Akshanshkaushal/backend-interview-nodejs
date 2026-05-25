const express = require('express');
const router = express.Router();
const { register, login, getOnlineUsers, getUserById } = require('../controllers/userController');
const { getUserChats } = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);

router.get('/online', auth, getOnlineUsers);
router.get('/:userId/chats', auth, getUserChats);
router.get('/:id', auth, getUserById);

module.exports = router;
