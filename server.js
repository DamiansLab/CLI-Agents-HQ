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

app.use(express.static(path.join(__dirname, 'client/dist')));
app.use(express.json());

// --- Process Management ---
const processes = new Map(); // agentId -> { proc, isThinking, cwd }

const stopProcess = (agentId) => {
  const agentData = processes.get(agentId);
  if (agentData && agentData.proc) {
    agentData.proc.kill();
    agentData.proc = null;
  }
};

const startAgentProcess = (agentId, directory, socket) => {
  const cwd = directory || process.cwd();
  
  if (processes.has(agentId)) {
    console.log(`Agent ${agentId} updated to directory ${cwd}.`);
    const data = processes.get(agentId);
    data.cwd = cwd;
    socket.emit('terminal-output', { agentId, data: `[Agent ready in ${cwd}]\n` });
    return;
  }

  console.log(`Initializing agent ${agentId} in ${cwd}`);
  processes.set(agentId, { proc: null, isThinking: false, cwd });
  socket.emit('terminal-output', { agentId, data: `[Agent initialized in ${cwd}]\n` });
};

// --- State Management ---
const loadState = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      if (data.trim() === '') return { workstations: new Array(10).fill(null), breakRoomAgents: [], logs: [] };
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading state:', error);
  }
  return { workstations: new Array(10).fill(null), breakRoomAgents: [], logs: [] };
};

const saveState = (state) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving state:', error);
  }
};

// --- Routes ---
app.get('/api/state', (req, res) => {
  res.json(loadState());
});

app.post('/api/state', (req, res) => {
  saveState(req.body);
  res.json({ success: true });
});

// Simple directory browser
app.post('/api/browse', (req, res) => {
  const targetDir = req.body.path || process.cwd();
  try {
    const items = fs.readdirSync(targetDir, { withFileTypes: true });
    const folders = items.filter(item => item.isDirectory()).map(item => item.name);
    const files = items.filter(item => item.isFile()).map(item => item.name);
    res.json({ 
      currentPath: targetDir, 
      folders, 
      files,
      parent: path.dirname(targetDir) 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a route to read file content for context
app.post('/api/read-file', (req, res) => {
  const { filePath } = req.body;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Socket Events ---
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('start-terminal', ({ agentId, directory }) => {
    startAgentProcess(agentId, directory, socket);
  });

  socket.on('restart-agent', ({ agentId, directory }) => {
    const data = processes.get(agentId);
    if (data) data.proc?.kill();
    startAgentProcess(agentId, directory, socket);
  });

  socket.on('chat-message', ({ agentId, message }) => {
    const agentData = processes.get(agentId);
    const cwd = agentData?.cwd || process.cwd();
    
    console.log(`[USER -> ${agentId}] ${message}`);
    socket.emit('agent-status', { agentId, status: 'thinking' });
    
    // Using positional query argument for Windows shell reliability
    const proc = spawn('gemini', [`"${message}"`, '--yolo'], { 
      cwd, 
      shell: true,
      env: { ...process.env, FORCE_COLOR: "1" }
    });

    let output = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      socket.emit('terminal-output', { agentId, data: text });
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      if (!text.includes('YOLO mode')) {
        socket.emit('terminal-output', { agentId, data: text, type: 'error' });
      } else {
        socket.emit('terminal-output', { agentId, data: text });
      }
    });

    proc.on('close', (code) => {
      if (output.trim()) {
        socket.emit('agent-response', { agentId, text: output });
      } else if (code !== 0) {
        socket.emit('agent-response', { agentId, text: `CLI Error (Code ${code}). Check Terminal.` });
      }
      socket.emit('agent-status', { agentId, status: 'idle' });
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
