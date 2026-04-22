const { io } = require('socket.io-client');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const socket = io(SERVER_URL);

console.log(`Connecting to Dashboard at ${SERVER_URL}...`);

const processes = new Map(); // agentId -> { proc, cwd }

const getSkillContent = (skillId) => {
  if (!skillId) return "";
  const filePath = path.join(__dirname, 'skills', `${skillId}.md`);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    console.error(`Error reading skill ${skillId}:`, err);
  }
  return "";
};

socket.on('connect', () => {
  console.log('Connected to Dashboard server');
  socket.emit('register-worker');
});

socket.on('disconnect', () => {
  console.log('Disconnected from Dashboard server');
});

socket.on('worker-start-terminal', ({ agentId, directory }) => {
  const cwd = directory || process.cwd();
  console.log(`Initializing agent ${agentId} in ${cwd}`);
  processes.set(agentId, { proc: null, cwd });
  socket.emit('worker-terminal-output', { agentId, data: `[Agent initialized in ${cwd}]\n` });
});

socket.on('worker-chat-message', ({ agentId, message, skillId, isSlashCommand, directory }) => {
  const agentData = processes.get(agentId);
  const cwd = directory || agentData?.cwd || process.cwd();
  
  // Update stored cwd if directory was provided
  if (directory && agentData) {
    agentData.cwd = directory;
  } else if (directory && !agentData) {
    processes.set(agentId, { proc: null, cwd: directory });
  }
  
  if (agentData && agentData.proc) {
    console.log(`[USER INPUT -> ${agentId}] ${message}`);
    agentData.proc.stdin.write(message + '\n');
    socket.emit('worker-terminal-output', { agentId, data: `\n[Input] > ${message}\n` });
    return;
  }

  console.log(`[USER -> ${agentId}] ${message} (Skill: ${skillId || 'none'})`);
  socket.emit('worker-agent-status', { agentId, status: 'thinking' });
  
  let finalSpawnCmd = '';
  if (isSlashCommand) {
    console.log(`[RAW CLI -> ${agentId}] ${message}`);
    finalSpawnCmd = `chcp 65001 > nul && gemini ${message}`;
  } else {
    const skillContent = getSkillContent(skillId);
    const fullPrompt = skillContent 
      ? `System Instructions:\n${skillContent}\n\nUser Message:\n${message}`
      : message;
    finalSpawnCmd = `chcp 65001 > nul && gemini "${fullPrompt.replace(/"/g, '\\"')}"`;
  }

  const proc = spawn(finalSpawnCmd, [], { 
    cwd, 
    shell: true,
    env: { ...process.env, FORCE_COLOR: "1" }
  });

  if (agentData) {
    agentData.proc = proc;
  } else {
    processes.set(agentId, { proc, cwd });
  }

  let output = '';

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    socket.emit('worker-terminal-output', { agentId, data: text });

    const isPrompt = text.match(/\? \[[yYnN/]+\]/) || 
                     text.match(/\(\d+-\d+\)/) || 
                     text.includes('Selection:') || 
                     text.includes('Confirm?') || 
                     (text.trim().endsWith('?') && text.length < 100) ||
                     text.trim().endsWith(':');

    if (isPrompt) {
      socket.emit('worker-agent-response', { 
        agentId, 
        text: "⚠️ I'm waiting for your input. You can type your choice (e.g. 1, 'yes', or a specific name) right here in the chat or in the terminal." 
      });
    }
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString();
    socket.emit('worker-terminal-output', { agentId, data: text, type: 'error' });
  });

  proc.on('close', (code) => {
    const data = processes.get(agentId);
    if (data) data.proc = null;
    
    if (output.trim()) {
      socket.emit('worker-agent-response', { agentId, text: output });
    } else if (code !== 0) {
      socket.emit('worker-agent-response', { agentId, text: `CLI Error (Code ${code}). Check Terminal.` });
    }
    socket.emit('worker-agent-status', { agentId, status: 'idle' });
  });
});

socket.on('worker-terminal-input', ({ agentId, input, directory }) => {
  const agentData = processes.get(agentId);
  
  if (agentData && agentData.proc) {
    console.log(`[USER INPUT -> ${agentId}] ${input}`);
    agentData.proc.stdin.write(input + '\n');
    return;
  }

  console.log(`[RAW TERMINAL -> ${agentId}] ${input}`);
  socket.emit('worker-agent-status', { agentId, status: 'thinking' });

  const cwd = directory || agentData?.cwd || process.cwd();

  // Update stored cwd if directory was provided
  if (directory && agentData) {
    agentData.cwd = directory;
  } else if (directory && !agentData) {
    processes.set(agentId, { proc: null, cwd: directory });
  }
  
  let finalArgs = input;
  if (input.toLowerCase().startsWith('/stats')) {
    finalArgs = input.replace('/stats', '--stats');
  } else if (input.toLowerCase().startsWith('/help')) {
    finalArgs = input.replace('/help', '--help');
  }

  const isSlash = input.startsWith('/');
  const finalSpawnCmd = isSlash 
    ? `chcp 65001 > nul && gemini ${finalArgs}`
    : `chcp 65001 > nul && gemini "${input.replace(/"/g, '\\"')}"`;

  const proc = spawn(finalSpawnCmd, [], { cwd, shell: true, env: { ...process.env, FORCE_COLOR: "1" } });
  
  if (agentData) agentData.proc = proc;
  else processes.set(agentId, { proc, cwd });

  let output = '';
  proc.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    socket.emit('worker-terminal-output', { agentId, data: text });
  });

  proc.on('close', (code) => {
    const data = processes.get(agentId);
    if (data) data.proc = null;
    socket.emit('worker-agent-status', { agentId, status: 'idle' });
  });
});

socket.on('worker-restart-agent', ({ agentId, directory }) => {
  const data = processes.get(agentId);
  if (data) {
    data.proc?.kill();
    data.proc = null;
  }
  const cwd = directory || data?.cwd || process.cwd();
  console.log(`Restarting agent ${agentId} in ${cwd}`);
  processes.set(agentId, { proc: null, cwd });
  socket.emit('worker-terminal-output', { agentId, data: `[Agent restarted in ${cwd}]\n` });
  socket.emit('worker-agent-status', { agentId, status: 'idle' });
});

socket.on('worker-stop-agent', ({ agentId }) => {
  const data = processes.get(agentId);
  if (data && data.proc) {
    data.proc.kill();
    data.proc = null;
    socket.emit('worker-terminal-output', { agentId, data: `\n[PROCESS TERMINATED BY USER]\n`, type: 'error' });
  }
  socket.emit('worker-agent-status', { agentId, status: 'idle' });
});

socket.on('worker-browse', ({ path: targetPath, requestId }) => {
  const targetDir = targetPath || process.cwd();
  try {
    const items = fs.readdirSync(targetDir, { withFileTypes: true });
    const folders = items.filter(item => item.isDirectory()).map(item => item.name);
    const files = items.filter(item => item.isFile()).map(item => item.name);
    socket.emit('worker-browse-response', { 
      requestId,
      data: {
        currentPath: targetDir, 
        folders, 
        files,
        parent: path.dirname(targetDir) 
      }
    });
  } catch (err) {
    socket.emit('worker-browse-response', { requestId, error: err.message });
  }
});

socket.on('worker-read-file', ({ filePath, requestId }) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    socket.emit('worker-read-file-response', { requestId, content });
  } catch (err) {
    socket.emit('worker-read-file-response', { requestId, error: err.message });
  }
});

socket.on('worker-reflect', ({ agentId, skillId, chatHistory, requestId }) => {
  const filePath = path.join(__dirname, 'skills', `${skillId}.md`);
  if (!fs.existsSync(filePath)) {
    return socket.emit('worker-reflect-response', { requestId, error: "Skill file not found", agentId });
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
          socket.emit('worker-reflect-response', { requestId, success: true, reflection: reflection.trim(), agentId });
        } else {
          socket.emit('worker-reflect-response', { requestId, error: "Marker not found", agentId });
        }
      } catch (err) {
        socket.emit('worker-reflect-response', { requestId, error: err.message, agentId });
      }
    } else {
      socket.emit('worker-reflect-response', { requestId, error: "Reflection failed", agentId });
    }
  });
});
