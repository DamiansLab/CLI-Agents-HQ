const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;
const dataFilePath = path.join(__dirname, 'data.json');
const skillsDirPath = path.join(__dirname, 'skills');

app.use(express.static(path.join(__dirname, 'client/dist')));
app.use(express.json());

// --- State & Worker Management ---
let workers = new Map(); // socket.id -> socket
let pendingRequests = new Map(); // requestId -> res

const getFirstWorker = () => {
  const workerIds = Array.from(workers.keys());
  if (workerIds.length > 0) {
    return workers.get(workerIds[0]);
  }
  return null;
};

// --- Skills Management ---
const getSkillContent = (skillId) => {
  if (!skillId) return "";
  const filePath = path.join(skillsDirPath, `${skillId}.md`);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    console.error(`Error reading skill ${skillId}:`, err);
  }
  return "";
};

app.get('/api/skills', (req, res) => {
  try {
    if (!fs.existsSync(skillsDirPath)) {
      return res.json([]);
    }
    const files = fs.readdirSync(skillsDirPath);
    const skills = files
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const id = f.replace('.md', '');
        const name = id.replace(/([A-Z])/g, ' $1').trim();
        return { id, name };
      });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reflect', (req, res) => {
  const { agentId, skillId, chatHistory } = req.body;
  const worker = getFirstWorker();
  
  if (worker) {
    const requestId = Math.random().toString(36).substr(2, 9);
    pendingRequests.set(requestId, res);
    worker.emit('worker-reflect', { agentId, skillId, chatHistory, requestId });
  } else {
    // Fallback to local reflection if no worker
    const filePath = path.join(skillsDirPath, `${skillId}.md`);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Skill file not found" });

    const recentConversation = chatHistory.slice(-10).map(m => `${m.sender}: ${m.text}`).join('\n');
    const reflectionPrompt = `Based on our recent conversation below, what unique preferences, technical constraints, or "Lessons Learned" should you remember for next time? Provide exactly 3-4 bullet points starting with "-".\n\nCONVERSATION:\n${recentConversation}`;

    const proc = spawn('gemini', [`"${reflectionPrompt.replace(/"/g, '\\"')}"`], { shell: true });
    let reflection = '';
    proc.stdout.on('data', (data) => { reflection += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0 && reflection.trim()) {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          if (content.includes("## Lessons Learned")) {
            fs.writeFileSync(filePath, content + `\n${reflection.trim()}\n`, 'utf8');
            res.json({ success: true, reflection: reflection.trim() });
          } else {
            res.json({ success: false, error: "Marker not found" });
          }
        } catch (err) { res.status(500).json({ error: err.message }); }
      } else { res.status(500).json({ error: "Reflection failed" }); }
    });
  }
});

// --- State Management ---
const loadState = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      if (data.trim() === '') return { workstations: new Array(10).fill(null), breakRoomAgents: [], logs: [] };
      return JSON.parse(data);
    }
  } catch (error) { console.error('Error loading state:', error); }
  return { workstations: new Array(10).fill(null), breakRoomAgents: [], logs: [] };
};

const saveState = (state) => {
  try { fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2), 'utf8'); } 
  catch (error) { console.error('Error saving state:', error); }
};

app.get('/api/state', (req, res) => { res.json(loadState()); });
app.post('/api/state', (req, res) => {
  saveState(req.body);
  res.json({ success: true });
});

app.post('/api/browse', (req, res) => {
  const worker = getFirstWorker();
  if (worker) {
    const requestId = Math.random().toString(36).substr(2, 9);
    pendingRequests.set(requestId, res);
    worker.emit('worker-browse', { path: req.body.path, requestId });
  } else {
    // Local browse
    const targetDir = req.body.path || process.cwd();
    try {
      const items = fs.readdirSync(targetDir, { withFileTypes: true });
      res.json({ 
        currentPath: targetDir, 
        folders: items.filter(i => i.isDirectory()).map(i => i.name), 
        files: items.filter(i => i.isFile()).map(i => i.name),
        parent: path.dirname(targetDir) 
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
});

app.post('/api/read-file', (req, res) => {
  const worker = getFirstWorker();
  if (worker) {
    const requestId = Math.random().toString(36).substr(2, 9);
    pendingRequests.set(requestId, res);
    worker.emit('worker-read-file', { filePath: req.body.filePath, requestId });
  } else {
    try { res.json({ content: fs.readFileSync(req.body.filePath, 'utf8') }); } 
    catch (err) { res.status(500).json({ error: err.message }); }
  }
});

// --- Socket Events ---
const processes = new Map(); // agentId -> { proc, isThinking, cwd }

io.on('connection', (socket) => {
  console.log('Client/Worker connected');

  socket.on('register-worker', () => {
    console.log(`Worker registered: ${socket.id}`);
    workers.set(socket.id, socket);
    io.emit('system-message', { message: 'Local Agent connected and ready.' });
  });

  socket.on('disconnect', () => {
    if (workers.has(socket.id)) {
      console.log(`Worker disconnected: ${socket.id}`);
      workers.delete(socket.id);
      io.emit('system-message', { message: 'Local Agent disconnected.', type: 'error' });
    }
  });

  // Relay events from Worker to Clients
  socket.on('worker-terminal-output', (data) => { io.emit('terminal-output', data); });
  socket.on('worker-agent-response', (data) => { io.emit('agent-response', data); });
  socket.on('worker-agent-status', (data) => { io.emit('agent-status', data); });
  
  socket.on('worker-browse-response', ({ requestId, data, error }) => {
    const res = pendingRequests.get(requestId);
    if (res) {
      if (error) res.status(500).json({ error });
      else res.json(data);
      pendingRequests.delete(requestId);
    }
  });

  socket.on('worker-read-file-response', ({ requestId, content, error }) => {
    const res = pendingRequests.get(requestId);
    if (res) {
      if (error) res.status(500).json({ error });
      else res.json({ content });
      pendingRequests.delete(requestId);
    }
  });

  socket.on('worker-reflect-response', ({ requestId, success, reflection, error }) => {
    const res = pendingRequests.get(requestId);
    if (res) {
      if (error) res.status(500).json({ error });
      else res.json({ success, reflection });
      pendingRequests.delete(requestId);
    }
  });

  // Handle Client events
  socket.on('start-terminal', ({ agentId, directory }) => {
    const worker = getFirstWorker();
    if (worker) worker.emit('worker-start-terminal', { agentId, directory });
    else {
      // Local fallback
      const cwd = directory || process.cwd();
      processes.set(agentId, { proc: null, isThinking: false, cwd });
      socket.emit('terminal-output', { agentId, data: `[Agent initialized locally in ${cwd}]\n` });
    }
  });

  socket.on('chat-message', ({ agentId, message, skillId }) => {
    const worker = getFirstWorker();
    if (worker) {
      worker.emit('worker-chat-message', { agentId, message, skillId });
    } else {
      // Local fallback (legacy logic)
      const agentData = processes.get(agentId);
      const cwd = agentData?.cwd || process.cwd();
      if (agentData && agentData.proc) {
        agentData.proc.stdin.write(message + '\n');
        socket.emit('terminal-output', { agentId, data: `\n[Chat Input] > ${message}\n` });
        return;
      }
      socket.emit('agent-status', { agentId, status: 'thinking' });
      const skillContent = getSkillContent(skillId);
      const fullPrompt = skillContent ? `System Instructions:\n${skillContent}\n\nUser Message:\n${message}` : message;
      const proc = spawn('gemini', [`"${fullPrompt.replace(/"/g, '\\"')}"`], { cwd, shell: true, env: { ...process.env, FORCE_COLOR: "1" } });
      if (agentData) agentData.proc = proc;
      let output = '';
      proc.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        socket.emit('terminal-output', { agentId, data: text });
      });
      proc.on('close', (code) => {
        if (agentData) agentData.proc = null;
        if (output.trim()) socket.emit('agent-response', { agentId, text: output });
        socket.emit('agent-status', { agentId, status: 'idle' });
      });
    }
  });

  socket.on('terminal-input', ({ agentId, input }) => {
    const worker = getFirstWorker();
    if (worker) worker.emit('worker-terminal-input', { agentId, input });
    else {
      const agentData = processes.get(agentId);
      if (agentData && agentData.proc) agentData.proc.stdin.write(input + '\n');
    }
  });

  socket.on('restart-agent', ({ agentId, directory }) => {
    const worker = getFirstWorker();
    if (worker) worker.emit('worker-restart-agent', { agentId, directory });
    else {
      const data = processes.get(agentId);
      if (data) {
        data.proc?.kill();
        data.proc = null;
        data.isThinking = false;
      }
      // Re-use start logic
      const cwd = directory || data?.cwd || process.cwd();
      processes.set(agentId, { proc: null, isThinking: false, cwd });
      socket.emit('terminal-output', { agentId, data: `[Agent restarted locally in ${cwd}]\n` });
      socket.emit('agent-status', { agentId, status: 'idle' });
    }
  });

  socket.on('stop-agent', ({ agentId }) => {
    const worker = getFirstWorker();
    if (worker) worker.emit('worker-stop-agent', { agentId });
    else {
      const data = processes.get(agentId);
      if (data && data.proc) {
        data.proc.kill();
        data.proc = null;
        data.isThinking = false;
        socket.emit('terminal-output', { agentId, data: `\n[PROCESS TERMINATED BY USER]\n`, type: 'error' });
      }
      socket.emit('agent-status', { agentId, status: 'idle' });
    }
  });
});

app.use((req, res) => { res.sendFile(path.join(__dirname, 'client/dist/index.html')); });

server.listen(port, () => { console.log(`Server is listening on port ${port}`); });
