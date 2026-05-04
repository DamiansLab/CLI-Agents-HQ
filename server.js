require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// --- Modular Imports ---
const stateManager = require('./lib/stateManager');
const userManager = require('./lib/userManager');

const app = express();
const server = http.createServer(app);

// --- Fail-Fast Security Check ---
const requiredEnv = ['JWT_SECRET', 'CLI_AGENTS_SECRET_KEY'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.error(`\x1b[31m[CRITICAL ERROR] Missing required environment variables: ${missingEnv.join(', ')}\x1b[0m`);
  console.error(`Application cannot start without these secrets. Please check your .env file.`);
  process.exit(1);
}

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const port = process.env.PORT || 5500;
const SECRET_KEY = process.env.JWT_SECRET;
const WORKER_SECRET = process.env.CLI_AGENTS_SECRET_KEY;

const skillsDirPath = path.join(__dirname, 'skills');

app.use(express.static(path.join(__dirname, 'client/dist')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Initialization ---
userManager.loadUsers();
stateManager.loadState();

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
  const user = userManager.getUsers().find(u => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { username: user.username, role: user.role, email: user.email } });
  } else res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/users', authenticate, isAdmin, (req, res) => res.json(userManager.getUsers().map(({ password, ...u }) => u)));

app.get('/api/worker-config', authenticate, (req, res) => {
  res.json({ url: `${req.protocol}://${req.get('host')}`, secret: WORKER_SECRET });
});

app.post('/api/users', authenticate, isAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  if (userManager.getUsers().find(u => u.username === username)) return res.status(400).json({ error: 'User exists' });
  userManager.addUser({ username, email, password, role });
  res.json({ success: true });
});

app.put('/api/users/:id', authenticate, isAdmin, (req, res) => {
  const success = userManager.updateUser(req.params.id, req.body);
  if (!success) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.delete('/api/users/:id', authenticate, isAdmin, (req, res) => {
  const success = userManager.deleteUser(req.params.id);
  if (!success) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// --- State Routes ---
app.get('/api/state', authenticate, (req, res) => res.json(stateManager.loadState()));
app.post('/api/state', authenticate, (req, res) => { 
  stateManager.saveState(req.body); 
  res.json({ success: true }); 
});

app.get('/api/skills', authenticate, (req, res) => {
  if (!fs.existsSync(skillsDirPath)) return res.json([]);
  res.json(fs.readdirSync(skillsDirPath).filter(f => f.endsWith('.md')).map(f => ({ id: f.replace('.md', ''), name: f.replace('.md', '').replace(/([A-Z])/g, ' $1').trim() })));
});

// --- Knowledge Vault Search ---
app.get('/api/vault/search', authenticate, (req, res) => {
  const { query } = req.query;
  const state = stateManager.getState();
  if (!query) return res.json(state.knowledgeVault || []);
  
  const results = (state.knowledgeVault || []).filter(item => 
    (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
    (item.content && item.content.toLowerCase().includes(query.toLowerCase()))
  );
  res.json(results);
});

// --- Socket Management ---
let workers = new Map();
let agentToWorker = new Map(); // agentId -> workerSocketId
let agentTimeouts = new Map(); // agentId -> TimeoutObject

const STALL_TIMEOUT = 60000; // 60 seconds

const clearStallTimeout = (agentId) => {
  if (agentTimeouts.has(agentId)) {
    clearTimeout(agentTimeouts.get(agentId));
    agentTimeouts.delete(agentId);
  }
};

const setStallTimeout = (agentId) => {
  clearStallTimeout(agentId);
  const timeout = setTimeout(() => {
    console.log(`[STALL DETECTED] Agent ${agentId} is taking too long.`);
    io.emit('agent-stalled', { agentId, message: 'Agent is taking longer than usual. It might be stuck or performing a complex task.' });
  }, STALL_TIMEOUT);
  agentTimeouts.set(agentId, timeout);
};

const getWorkerForAgent = (agentId) => {
  const socketId = agentToWorker.get(agentId);
  if (socketId && workers.has(socketId)) return workers.get(socketId);
  
  const worker = Array.from(workers.values())[0];
  if (worker && agentId) agentToWorker.set(agentId, worker.id);
  return worker;
};

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
      for (const [agentId, workerId] of agentToWorker.entries()) {
        if (workerId === socket.id) agentToWorker.delete(agentId);
      }
      io.emit('system-message', { message: 'Local Agent disconnected.', type: 'error' });
    }
  });

  socket.on('worker-sync-skills', (workerSkills) => {
    console.log(`[SYNC] Handshake started with ${workerSkills.length} local skills (Hash-Verified).`);
    const skillsToDownload = [];
    
    workerSkills.forEach(wSkill => {
      const serverPath = path.join(skillsDirPath, `${wSkill.id}.md`);
      
      if (fs.existsSync(serverPath)) {
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        const serverHash = crypto.createHash('md5').update(serverContent).digest('hex');
        
        // If hashes match, skip sync entirely
        if (wSkill.hash === serverHash) return;

        const serverStat = fs.statSync(serverPath);
        if (wSkill.mtime > serverStat.mtimeMs) {
          // Worker is newer
          console.log(`[SYNC] Updating Server: ${wSkill.id}.md (Content Mismatch)`);
          fs.writeFileSync(serverPath, wSkill.content);
        } else {
          // Server is newer
          console.log(`[SYNC] Preparing Worker Download: ${wSkill.id}.md (Content Mismatch)`);
          skillsToDownload.push({ 
            id: wSkill.id, 
            content: serverContent,
            mtime: serverStat.mtimeMs,
            hash: serverHash
          });
        }
      } else {
        // Server missing
        console.log(`[SYNC] Creating Server File: ${wSkill.id}.md`);
        fs.writeFileSync(serverPath, wSkill.content);
      }
    });

    if (skillsToDownload.length > 0) {
      socket.emit('update-local-skills', skillsToDownload);
    }
  });

  socket.on('worker-terminal-output', (d) => {
    clearStallTimeout(d.agentId);
    io.emit('terminal-output', d);
  });
  socket.on('worker-agent-response', (d) => {
    clearStallTimeout(d.agentId);
    const state = stateManager.getState();
    const agentIndex = state.workstations.findIndex(a => a?.id === d.agentId);
    if (agentIndex !== -1) {
      state.workstations[agentIndex].chatHistory = state.workstations[agentIndex].chatHistory || [];
      state.workstations[agentIndex].chatHistory.push({ sender: 'Agent', text: d.text, timestamp: new Date().toLocaleTimeString() });
      stateManager.saveState(state);
    }
    io.emit('agent-response', d);
  });
  socket.on('worker-agent-status', (d) => {
    if (d.status !== 'thinking') clearStallTimeout(d.agentId);
    io.emit('agent-status', d);
  });
  socket.on('worker-browse-response', (d) => {
    clearStallTimeout(d.agentId);
    io.emit('browse-response', d);
  });
  socket.on('worker-read-file-response', (d) => {
    clearStallTimeout(d.agentId);
    io.emit('read-file-response', d);
  });
  socket.on('worker-reflect-response', (d) => {
    clearStallTimeout(d.agentId);
    if (d.success && d.agentId) updateAgentProgress(d.agentId, d.reflection);
    io.emit('reflect-response', d);
  });

  socket.on('chat-message', (data) => {
    setStallTimeout(data.agentId);
    const state = stateManager.getState();
    const agentIndex = state.workstations.findIndex(a => a?.id === data.agentId);
    if (agentIndex !== -1) {
      state.workstations[agentIndex].chatHistory = state.workstations[agentIndex].chatHistory || [];
      state.workstations[agentIndex].chatHistory.push({ sender: 'User', text: data.message, timestamp: new Date().toLocaleTimeString() });
      stateManager.saveState(state);
    }
    const worker = getWorkerForAgent(data.agentId);
    if (worker) worker.emit('worker-chat-message', { ...data, skillContent: getSkillContent(data.skillId) });
  });

  socket.on('group-chat-message', ({ agentIds, message, projectBrief, history }) => {
    const state = stateManager.getState();
    agentIds.forEach(agentId => {
      setStallTimeout(agentId);
      const worker = getWorkerForAgent(agentId);
      if (worker) {
        const agent = [...state.workstations, ...state.breakRoomAgents].find(a => a?.id === agentId);
        const agentIndex = state.workstations.findIndex(a => a?.id === agentId);
        if (agentIndex !== -1) {
          state.workstations[agentIndex].chatHistory = state.workstations[agentIndex].chatHistory || [];
          state.workstations[agentIndex].chatHistory.push({ sender: 'System/Team', text: message, timestamp: new Date().toLocaleTimeString() });
          stateManager.saveState(state);
        }
        worker.emit('worker-chat-message', { agentId, message, skillId: agent?.skillId, skillContent: getSkillContent(agent?.skillId), projectBrief, history });
      }
    });
  });

  socket.on('browse-directory', (d) => {
    setStallTimeout(d.agentId);
    getWorkerForAgent(d.agentId)?.emit('worker-browse', d);
  });

  socket.on('read-file', (d) => {
    setStallTimeout(d.agentId);
    getWorkerForAgent(d.agentId)?.emit('worker-read-file', d);
  });

  socket.on('trigger-reflect', (d) => {
    setStallTimeout(d.agentId);
    getWorkerForAgent(d.agentId)?.emit('worker-reflect', d);
  });

  socket.on('terminal-input', (d) => {
    setStallTimeout(d.agentId);
    getWorkerForAgent(d.agentId)?.emit('worker-terminal-input', d);
  });
  socket.on('start-terminal', (d) => {
    setStallTimeout(d.agentId);
    getWorkerForAgent(d.agentId)?.emit('worker-start-terminal', d);
  });
  socket.on('stop-agent', (d) => {
    clearStallTimeout(d.agentId);
    getWorkerForAgent(d.agentId)?.emit('worker-stop-agent', d);
  });
  socket.on('restart-agent', (d) => {
    clearStallTimeout(d.agentId);
    getWorkerForAgent(d.agentId)?.emit('worker-restart-agent', d);
  });
  
  socket.on('read-messages', ({ agentId }) => {
    const state = stateManager.getState();
    state.workstations = state.workstations.map(a => (a?.id === agentId ? { ...a, hasNotification: false } : a));
    state.breakRoomAgents = state.breakRoomAgents.map(a => (a?.id === agentId ? { ...a, hasNotification: false } : a));
    stateManager.saveState(state);
    io.emit('agent-updated', { agentId, updates: { hasNotification: false } });
  });
});

function updateAgentProgress(agentId, reflection) {
  const state = stateManager.getState();
  const agent = [...state.workstations, ...state.breakRoomAgents].find(a => a?.id === agentId);
  const updates = { xp: (agent?.xp || 0) + 100, level: Math.floor(((agent?.xp || 0) + 100) / 300) + 1 };
  state.workstations = state.workstations.map(a => (a?.id === agentId ? { ...a, ...updates } : a));
  state.breakRoomAgents = state.breakRoomAgents.map(a => (a?.id === agentId ? { ...a, ...updates } : a));
  if (agent && agent.skillId && reflection) {
    const skillPath = path.join(skillsDirPath, `${agent.skillId}.md`);
    try { if (fs.existsSync(skillPath)) fs.appendFileSync(skillPath, `\n\n### 🧠 Lessons Learned (${new Date().toLocaleDateString()})\n${reflection}\n`); } catch (err) {}
  }
  stateManager.saveState(state);
  io.emit('agent-updated', { agentId, updates });
}

const getSkillContent = (id) => id && fs.existsSync(path.join(skillsDirPath, `${id}.md`)) ? fs.readFileSync(path.join(skillsDirPath, `${id}.md`), 'utf8') : "";

app.use((req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));
server.listen(port, () => console.log(`CLI Agents HQ Secure Server on port ${port}`));
