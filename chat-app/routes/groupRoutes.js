const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { create, addMember, removeMember, messages } = require('../controllers/groupController');

router.use(auth);

router.post('/create', create);
router.post('/:groupId/add', addMember);
router.post('/:groupId/remove', removeMember);
router.get('/:groupId/messages', messages);

module.exports = router;
