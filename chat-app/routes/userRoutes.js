const express = require('express');
const router = express.Router();
const { register, login, getOnlineUsers, getUserById } = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/online', auth, getOnlineUsers);
router.get('/:id', auth, getUserById);

module.exports = router;
