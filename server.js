const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const port = process.env.PORT || 5500;
const SECRET_KEY = process.env.JWT_SECRET || 'cli-agents-super-secret-jwt-key';
const WORKER_SECRET = process.env.CLI_AGENTS_SECRET_KEY || 'change-me-in-plesk-env';

const dataFilePath = path.join(__dirname, 'data.json');
const usersFilePath = path.join(__dirname, 'users.json');
const skillsDirPath = path.join(__dirname, 'skills');

app.use(express.static(path.join(__dirname, 'client/dist')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- User Management ---
let users = [];
if (fs.existsSync(usersFilePath)) {
  users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
} else {
  const salt = bcrypt.genSaltSync(10);
  users = [{
    id: 'admin-1',
    username: 'Admin',
    email: 'admin@cli-agents.local',
    password: bcrypt.hashSync('admin123', salt),
    role: 'Admin'
  }];
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

const saveUsers = () => fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

// --- Auth Middleware ---
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { username: user.username, role: user.role, email: user.email } });
  } else res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/users', authenticate, isAdmin, (req, res) => res.json(users.map(({ password, ...u }) => u)));

app.get('/api/worker-config', authenticate, (req, res) => {
  res.json({ url: `${req.protocol}://${req.get('host')}`, secret: WORKER_SECRET });
});

app.post('/api/users', authenticate, isAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'User exists' });
  users.push({ id: Math.random().toString(36).substr(2, 9), username, email, role, password: bcrypt.hashSync(password, 10) });
  saveUsers();
  res.json({ success: true });
});

// ... (Put/Delete users omitted for brevity, keeping existing logic)
app.put('/api/users/:id', authenticate, isAdmin, (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  users[index] = { ...users[index], ...req.body };
  if (req.body.password) users[index].password = bcrypt.hashSync(req.body.password, 10);
  saveUsers();
  res.json({ success: true });
});

app.delete('/api/users/:id', authenticate, isAdmin, (req, res) => {
  users = users.filter(u => u.id !== req.params.id);
  saveUsers();
  res.json({ success: true });
});

// --- State Management ---
let state = { workstations: new Array(10).fill(null), breakRoomAgents: [], logs: [], globalContext: "", knowledgeVault: [] };
const loadState = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      if (data.trim() !== '') state = JSON.parse(data);
    }
  } catch (e) {}
  return state;
};
const saveState = (s) => { state = s; fs.writeFileSync(dataFilePath, JSON.stringify(s, null, 2)); };
loadState();

app.get('/api/state', authenticate, (req, res) => res.json(loadState()));
app.post('/api/state', authenticate, (req, res) => { saveState(req.body); res.json({ success: true }); });

app.get('/api/skills', authenticate, (req, res) => {
  if (!fs.existsSync(skillsDirPath)) return res.json([]);
  res.json(fs.readdirSync(skillsDirPath).filter(f => f.endsWith('.md')).map(f => ({ id: f.replace('.md', ''), name: f.replace('.md', '').replace(/([A-Z])/g, ' $1').trim() })));
});

// --- Socket Management ---
let workers = new Map();

io.on('connection', (socket) => {
  socket.on('register-worker', ({ secret }) => {
    if (secret !== WORKER_SECRET) {
      socket.emit('auth-error', { message: 'Invalid Secret' });
      return socket.disconnect();
    }
    workers.set(socket.id, socket);
    io.emit('system-message', { message: 'Verified Local Agent connected.' });
  });

  socket.on('disconnect', () => {
    if (workers.has(socket.id)) {
      workers.delete(socket.id);
      io.emit('system-message', { message: 'Local Agent disconnected.', type: 'error' });
    }
  });

  // RELAY: Worker -> All Dashboard Clients
  socket.on('worker-terminal-output', (d) => io.emit('terminal-output', d));
  socket.on('worker-agent-response', (d) => io.emit('agent-response', d));
  socket.on('worker-agent-status', (d) => io.emit('agent-status', d));
  socket.on('worker-browse-response', (d) => io.emit('browse-response', d));
  socket.on('worker-read-file-response', (d) => io.emit('read-file-response', d));
  socket.on('worker-reflect-response', (d) => {
    if (d.success && d.agentId) updateAgentProgress(d.agentId, d.reflection);
    io.emit('reflect-response', d);
  });

  // RELAY: Dashboard Client -> Worker
  socket.on('chat-message', (data) => {
    const worker = Array.from(workers.values())[0];
    if (worker) {
      const skillContent = getSkillContent(data.skillId);
      worker.emit('worker-chat-message', { ...data, skillContent });
    }
  });

  socket.on('browse-directory', (data) => {
    const worker = Array.from(workers.values())[0];
    if (worker) worker.emit('worker-browse', data);
  });

  socket.on('read-file', (data) => {
    const worker = Array.from(workers.values())[0];
    if (worker) worker.emit('worker-read-file', data);
  });

  socket.on('trigger-reflect', (data) => {
    const worker = Array.from(workers.values())[0];
    if (worker) worker.emit('worker-reflect', data);
  });

  socket.on('terminal-input', (d) => Array.from(workers.values())[0]?.emit('worker-terminal-input', d));
  socket.on('start-terminal', (d) => Array.from(workers.values())[0]?.emit('worker-start-terminal', d));
  socket.on('stop-agent', (d) => Array.from(workers.values())[0]?.emit('worker-stop-agent', d));
  socket.on('restart-agent', (d) => Array.from(workers.values())[0]?.emit('worker-restart-agent', d));
  
  socket.on('read-messages', ({ agentId }) => {
    state.workstations = state.workstations.map(a => (a?.id === agentId ? { ...a, hasNotification: false } : a));
    state.breakRoomAgents = state.breakRoomAgents.map(a => (a?.id === agentId ? { ...a, hasNotification: false } : a));
    saveState(state);
    io.emit('agent-updated', { agentId, updates: { hasNotification: false } });
  });
});

function updateAgentProgress(agentId, reflection) {
  // logic to update XP and level...
  state.workstations = state.workstations.map(a => (a?.id === agentId ? { ...a, xp: (a.xp||0)+100, level: Math.floor(((a.xp||0)+100)/300)+1 } : a));
  state.breakRoomAgents = state.breakRoomAgents.map(a => (a?.id === agentId ? { ...a, xp: (a.xp||0)+100, level: Math.floor(((a.xp||0)+100)/300)+1 } : a));
  saveState(state);
  io.emit('agent-xp-update', { agentId, xp: 100 });
}

const getSkillContent = (id) => id && fs.existsSync(path.join(skillsDirPath, `${id}.md`)) ? fs.readFileSync(path.join(skillsDirPath, `${id}.md`), 'utf8') : "";

app.use((req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));
server.listen(port, () => console.log(`CLI Agents HQ Secure Server on port ${port}`));
