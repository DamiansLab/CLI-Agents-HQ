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
        // Convert PascalCase to Spaced Name (e.g. BugHunter -> Bug Hunter)
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
  if (!skillId || !chatHistory || chatHistory.length === 0) {
    return res.status(400).json({ error: "Missing data for reflection" });
  }

  const filePath = path.join(skillsDirPath, `${skillId}.md`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Skill file not found" });
  }

  const recentConversation = chatHistory.slice(-10).map(m => `${m.sender}: ${m.text}`).join('\n');
  const reflectionPrompt = `Based on our recent conversation below, what unique preferences, technical constraints, or "Lessons Learned" should you remember for next time? Provide exactly 3-4 bullet points starting with "-".\n\nCONVERSATION:\n${recentConversation}`;

  console.log(`[REFLECTING] Agent ${agentId} learning for skill ${skillId}...`);

  const proc = spawn('gemini', [`"${reflectionPrompt.replace(/"/g, '\\"')}"`], { shell: true });
  let reflection = '';

  proc.stdout.on('data', (data) => { reflection += data.toString(); });
  
  proc.on('close', (code) => {
    if (code === 0 && reflection.trim()) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const lessonMarker = "## Lessons Learned";
        if (content.includes(lessonMarker)) {
          const newContent = content + `\n${reflection.trim()}\n`;
          fs.writeFileSync(filePath, newContent, 'utf8');
          res.json({ success: true, reflection: reflection.trim() });
        } else {
          res.json({ success: false, error: "Marker not found" });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(500).json({ error: "Reflection failed" });
    }
  });
});

// --- State Management ---

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

  socket.on('chat-message', ({ agentId, message, skillId }) => {
    const agentData = processes.get(agentId);
    const cwd = agentData?.cwd || process.cwd();
    
    // If a process is already running, treat this message as input to that process
    if (agentData && agentData.proc) {
      console.log(`[USER INPUT -> ${agentId}] ${message}`);
      agentData.proc.stdin.write(message + '\n');
      socket.emit('terminal-output', { agentId, data: `\n[Chat Input] > ${message}\n` });
      return;
    }

    console.log(`[USER -> ${agentId}] ${message} (Skill: ${skillId || 'none'})`);
    socket.emit('agent-status', { agentId, status: 'thinking' });
    if (agentData) agentData.isThinking = true;
    
    const skillContent = getSkillContent(skillId);
    const fullPrompt = skillContent 
      ? `System Instructions:\n${skillContent}\n\nUser Message:\n${message}`
      : message;

    const proc = spawn('gemini', [`"${fullPrompt.replace(/"/g, '\\"')}"`], { 
      cwd, 
      shell: true,
      env: { ...process.env, FORCE_COLOR: "1" }
    });

    if (agentData) {
      agentData.proc = proc;
    }

    let output = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      socket.emit('terminal-output', { agentId, data: text });

      // Improved detection for interactive prompts (Y/N, selections, or open questions)
      const isPrompt = text.match(/\? \[[yYnN/]+\]/) || 
                       text.match(/\(\d+-\d+\)/) || // Selection ranges like (1-5)
                       text.includes('Selection:') || 
                       text.includes('Confirm?') || 
                       (text.trim().endsWith('?') && text.length < 100) ||
                       text.trim().endsWith(':');

      if (isPrompt) {
        socket.emit('agent-response', { 
          agentId, 
          text: "⚠️ I'm waiting for your input. You can type your choice (e.g. 1, 'yes', or a specific name) right here in the chat or in the terminal." 
        });
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      socket.emit('terminal-output', { agentId, data: text, type: 'error' });
    });

    proc.on('close', (code) => {
      if (agentData) agentData.proc = null;
      
      if (output.trim()) {
        socket.emit('agent-response', { agentId, text: output });
      } else if (code !== 0) {
        socket.emit('agent-response', { agentId, text: `CLI Error (Code ${code}). Check Terminal.` });
      }
      socket.emit('agent-status', { agentId, status: 'idle' });
    });
  });

  socket.on('terminal-input', ({ agentId, input }) => {
    const agentData = processes.get(agentId);
    if (agentData && agentData.proc) {
      console.log(`[USER INPUT -> ${agentId}] ${input}`);
      agentData.proc.stdin.write(input + '\n');
      // Also echo the input to the terminal view
      socket.emit('terminal-output', { agentId, data: `\n> ${input}\n` });
    } else {
      socket.emit('terminal-output', { agentId, data: `[No active process to receive input]\n`, type: 'error' });
    }
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
