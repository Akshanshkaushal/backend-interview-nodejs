/**
 * CHAT APP CLIENT EXAMPLE
 * Shows how to interact with the chat server using Socket.io
 * This is vanilla JavaScript example (works in browser)
 */

// ============ SETUP ============

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token'), // Get JWT from login
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// ============ AUTHENTICATION ============

async function register(name, email, password) {
  const response = await fetch('http://localhost:5000/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
  }
  return data;
}

async function login(email, password) {
  const response = await fetch('http://localhost:5000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
    // Reconnect socket with new token
    socket.auth.token = data.token;
    socket.connect();
  }
  return data;
}

// ============ CONVERSATIONS ============

async function createDM(recipientId) {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/chat/dm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ recipientId }),
  });
  return await response.json();
}

async function createGroup(name, memberIds) {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/chat/group', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, memberIds }),
  });
  return await response.json();
}

async function getConversations() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/chat/conversations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await response.json();
}

async function getMessages(conversationId, limit = 50, skip = 0) {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `http://localhost:5000/api/chat/${conversationId}/messages?limit=${limit}&skip=${skip}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return await response.json();
}

// ============ SOCKET EVENTS - SENDING ============

function sendMessage(conversationId, content) {
  socket.emit('message:send', { conversationId, content });
}

function joinConversation(conversationId) {
  socket.emit('conversation:join', { conversationId });
}

function leaveConversation(conversationId) {
  socket.emit('conversation:leave', { conversationId });
}

function startTyping(conversationId) {
  socket.emit('typing:start', { conversationId });
}

function stopTyping(conversationId) {
  socket.emit('typing:stop', { conversationId });
}

function getOnlineUsers() {
  socket.emit('users:getOnline');
}

// ============ SOCKET EVENTS - RECEIVING ============

// Listen for new messages
socket.on('message:received', (data) => {
  console.log('New message received:', data.message);
  displayMessage(data.message);
});

// Confirmation that message was sent
socket.on('message:sent', (data) => {
  console.log('Message sent successfully');
});

// User online notification
socket.on('user:online', (data) => {
  console.log(`User ${data.userId} came online`);
  updateUserStatus(data.userId, 'online');
});

// User offline notification
socket.on('user:offline', (data) => {
  console.log(`User ${data.userId} went offline`);
  updateUserStatus(data.userId, 'offline');
});

// User is typing
socket.on('user:typing', (data) => {
  console.log(`User ${data.userId} is typing...`);
  showTypingIndicator(data.userId);
});

// User stopped typing
socket.on('user:stopped-typing', (data) => {
  console.log(`User ${data.userId} stopped typing`);
  hideTypingIndicator(data.userId);
});

// Get online users list
socket.on('users:online', (users) => {
  console.log('Online users:', users);
  updateOnlineList(users);
});

// Error handling
socket.on('message:error', (data) => {
  console.error('Message error:', data.error);
});

socket.on('error', (data) => {
  console.error('Socket error:', data.error);
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// ============ UI HELPERS ============

function displayMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.innerHTML = `
    <strong>${message.sender.name}</strong>
    <p>${message.content}</p>
    <small>${new Date(message.createdAt).toLocaleTimeString()}</small>
  `;
  document.getElementById('messages').appendChild(messageDiv);
}

function updateUserStatus(userId, status) {
  const userElement = document.getElementById(`user-${userId}`);
  if (userElement) {
    userElement.className = `user-${status}`;
  }
}

function showTypingIndicator(userId) {
  const typingDiv = document.createElement('div');
  typingDiv.id = `typing-${userId}`;
  typingDiv.className = 'typing-indicator';
  typingDiv.innerHTML = `<span>User is typing...</span>`;
  document.getElementById('messages').appendChild(typingDiv);
}

function hideTypingIndicator(userId) {
  const typingDiv = document.getElementById(`typing-${userId}`);
  if (typingDiv) typingDiv.remove();
}

function updateOnlineList(users) {
  const listDiv = document.getElementById('online-users');
  listDiv.innerHTML = '';
  users.forEach((user) => {
    const userDiv = document.createElement('div');
    userDiv.id = `user-${user._id}`;
    userDiv.className = 'user-online';
    userDiv.textContent = user.name;
    listDiv.appendChild(userDiv);
  });
}

// ============ EXAMPLE USAGE ============

// 1. Register and login
// await register('Alice', 'alice@example.com', 'password123');
// await login('alice@example.com', 'password123');

// 2. Get conversations
// const conversations = await getConversations();

// 3. Join a conversation
// if (conversations.length > 0) {
//   const firstConv = conversations[0];
//   joinConversation(firstConv._id);
// }

// 4. Get messages from conversation
// const messages = await getMessages(conversationId);

// 5. Send a message
// sendMessage(conversationId, 'Hello everyone!');

// 6. Get online users
// getOnlineUsers();

// 7. Show typing status
// startTyping(conversationId);
// setTimeout(() => stopTyping(conversationId), 3000);

// 8. Create new DM
// const dmResult = await createDM('other_user_id');

// 9. Create group
// const groupResult = await createGroup('Team Discussion', ['user_id_2', 'user_id_3']);
