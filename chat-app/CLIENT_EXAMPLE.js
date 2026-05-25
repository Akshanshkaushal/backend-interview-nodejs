const API_URL = 'http://localhost:5000/api/v1';
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') },
});

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

async function register(name, email, password, phone) {
  const res = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone }),
  });

  return saveSession(await res.json());
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return saveSession(await res.json());
}

function saveSession(data) {
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.user.id);
    socket.auth.token = data.token;
    socket.connect();
  }
  return data;
}

async function getChats(page = 1, limit = 20) {
  const userId = localStorage.getItem('userId');
  const res = await fetch(`${API_URL}/users/${userId}/chats?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  return res.json();
}

async function getDirectMessages(receiverId, page = 1, limit = 30) {
  const userId = localStorage.getItem('userId');
  const res = await fetch(
    `${API_URL}/messages/${userId}/${receiverId}?page=${page}&limit=${limit}`,
    { headers: authHeaders() }
  );
  return res.json();
}

async function createGroup(name, memberIds, description) {
  const res = await fetch(`${API_URL}/groups/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, memberIds, description }),
  });
  return res.json();
}

async function sendMessage(receiverId, content) {
  const res = await fetch(`${API_URL}/messages/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ receiverId, content, type: 'text' }),
  });
  return res.json();
}

function joinChat(chatId) {
  socket.emit('chat:join', { chatId });
}

function sendRealtimeMessage(chatId, content) {
  socket.emit('message:send', { chatId, content, type: 'text' }, (ack) => {
    if (!ack.ok) console.error(ack.error);
  });
}

socket.on('message:new', (message) => console.log('new message', message));
socket.on('user:online', ({ userId }) => console.log('online', userId));
socket.on('user:offline', ({ userId }) => console.log('offline', userId));
socket.on('typing:start', ({ userId, chatId }) => console.log('typing', userId, chatId));
socket.on('typing:stop', ({ userId, chatId }) => console.log('stopped typing', userId, chatId));
