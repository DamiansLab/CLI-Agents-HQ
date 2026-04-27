require('dotenv').config();
const { io } = require('socket.io-client');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

let SERVER_URL = process.env.SERVER_URL;
let SECRET_KEY = process.env.CLI_AGENTS_SECRET_KEY;

// Global state map for tracking active processes
const processes = new Map(); // agentId -> { proc, cwd, lastPromptTime }

async function start() {
  const configPath = path.join(__dirname, '.agent-config.json');
  let savedConfig = { lastUrl: '', lastSecret: '' };
  
  if (fs.existsSync(configPath)) {
    try { savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) {}
  }

  if (!SERVER_URL || !SECRET_KEY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\n--- 🤖 CLI Agents HQ: Secure Local Connector ---');

    if (!SERVER_URL) {
      const prompt = savedConfig.lastUrl ? `Enter Dashboard URL [Default: ${savedConfig.lastUrl}]: ` : 'Enter Dashboard URL: ';
      const answer = await new Promise(res => rl.question(prompt, res));
      SERVER_URL = answer.trim() || savedConfig.lastUrl;
    }

    if (!SECRET_KEY) {
      const prompt = savedConfig.lastSecret ? `Enter Shared Secret Key [Default: ****]: ` : 'Enter Shared Secret Key: ';
      const answer = await new Promise(res => rl.question(prompt, res));
      SECRET_KEY = answer.trim() || savedConfig.lastSecret;
    }
    rl.close();

    if (!SERVER_URL || !SECRET_KEY) {
      console.error('❌ Error: URL and Secret Key are required.');
      process.exit(1);
    }

    fs.writeFileSync(configPath, JSON.stringify({ lastUrl: SERVER_URL, lastSecret: SECRET_KEY }));
  }

  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'], // Fallback to polling if websockets are blocked
    reconnectionAttempts: 5,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('✅ Connected to Dashboard. Authenticating...');
    socket.emit('register-worker', { secret: SECRET_KEY });
  });

  socket.on('connect_error', (err) => {
    console.error(`\n❌ Connection Error: ${err.message}`);
    if (err.message.includes('xhr poll error')) {
      console.log('👉 Hint: This usually means the server URL is wrong or the server is down.');
    } else if (err.message.includes('websocket error')) {
      console.log('👉 Hint: The server is active, but your Proxy (Nginx/Plesk) is blocking WebSockets.');
    }
  });

  socket.on('auth-error', (data) => {
    console.error(`\n❌ Authentication Failed: ${data.message}`);
    process.exit(1);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Dashboard server');
  });

  socket.on('worker-start-terminal', ({ agentId, agentName, directory }) => {
    const cwd = directory || process.cwd();
    console.log(`Initializing agent ${agentName || agentId} in ${cwd}`);
    processes.set(agentId, { proc: null, cwd });
    socket.emit('worker-terminal-output', { agentId, data: `[Agent initialized in ${cwd}]\n` });
  });

  socket.on('worker-chat-message', ({ agentId, agentName, message, skillId, skillContent, projectBrief, history, isSlashCommand, directory }) => {
    let agentData = processes.get(agentId);
    const cwd = directory || agentData?.cwd || process.cwd();
    
    if (!agentData) {
      agentData = { proc: null, cwd };
      processes.set(agentId, agentData);
    }

    if (directory) agentData.cwd = directory;
    
    if (agentData.proc) {
      console.log(`[USER INPUT -> ${agentName || agentId}] ${message}`);
      agentData.proc.stdin.write(message + '\n');
      socket.emit('worker-terminal-output', { agentId, data: `\n[Input] > ${message}\n` });
      return;
    }

    console.log(`[USER -> ${agentName || agentId}] ${message} (Skill: ${skillId || 'none'})`);
    socket.emit('worker-agent-status', { agentId, status: 'thinking' });
    
    // On Windows, 'gemini' is usually 'gemini.cmd'. shell: true finds it and handles stdin piping correctly.
    const proc = spawn('gemini', [], { 
      cwd: agentData.cwd, 
      shell: true,
      env: { ...process.env, FORCE_COLOR: "3", TERM: "xterm-256color" }
    });

    agentData.proc = proc;

    // Construct the prompt
    let systemInstructions = skillContent || "";
    if (projectBrief) {
      systemInstructions = `Global Project Brief:\n${projectBrief}\n\n${systemInstructions ? `Role Instructions:\n${systemInstructions}` : ""}`;
    }

    let userMessage = message;
    if (history && history.length > 0) {
      const historyText = history.map(m => `[${m.sender}]: ${m.text}`).join('\n');
      userMessage = `Conference Room History:\n${historyText}\n\nUser Message (New):\n${message}`;
    }

    const fullPrompt = (systemInstructions && !isSlashCommand)
      ? `System Instructions:\n${systemInstructions.trim()}\n\nUser Message:\n${userMessage}`
      : userMessage;
    
    // Write the prompt to stdin and then a newline to "enter" it.
    proc.stdin.write(fullPrompt + '\n');
    proc.stdin.end();

    let output = '';
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes("256-color support not detected")) return;
      output += text;
      socket.emit('worker-terminal-output', { agentId, data: text });

      const trimmed = text.trim();
      const isPrompt = (text.match(/\? \[[yYnN/]+\]/) || 
                       text.match(/\(\d+-\d+\)/) || 
                       trimmed.endsWith('Selection:') || 
                       trimmed.endsWith('Confirm?') || 
                       (trimmed.endsWith('?') && trimmed.length < 50 && !trimmed.includes('\n')) ||
                       (trimmed.endsWith(':') && trimmed.length < 30 && !trimmed.includes('\n'))) &&
                       !trimmed.toLowerCase().includes('result:');

      if (isPrompt && (!agentData.lastPromptTime || Date.now() - agentData.lastPromptTime > 5000)) {
        agentData.lastPromptTime = Date.now();
        socket.emit('worker-agent-response', { 
          agentId, 
          text: "⚠️ I'm waiting for your input. You can type your choice (e.g. 1, 'yes', or a specific name) right here in the chat or in the terminal." 
        });
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      if (text.includes("256-color support not detected")) return;
      socket.emit('worker-terminal-output', { agentId, data: text, type: 'error' });
    });

    proc.on('close', (code) => {
      agentData.proc = null;
      if (output.trim()) socket.emit('worker-agent-response', { agentId, text: output });
      else if (code !== 0) socket.emit('worker-agent-response', { agentId, text: `CLI Error (Code ${code}). Check Terminal.` });
      socket.emit('worker-agent-status', { agentId, status: 'idle' });
    });
  });

  socket.on('worker-terminal-input', ({ agentId, input, directory }) => {
    let agentData = processes.get(agentId);
    if (!agentData) {
      agentData = { proc: null, cwd: directory || process.cwd() };
      processes.set(agentId, agentData);
    }
    
    if (agentData.proc) {
      console.log(`[USER INPUT -> ${agentId}] ${input}`);
      agentData.proc.stdin.write(input + '\n');
      return;
    }

    console.log(`[RAW TERMINAL -> ${agentId}] ${input}`);
    socket.emit('worker-agent-status', { agentId, status: 'thinking' });

    const cwd = directory || agentData.cwd || process.cwd();
    if (directory) agentData.cwd = directory;
    
    let finalArgs = input;
    if (input.toLowerCase().startsWith('/stats')) finalArgs = input.replace('/stats', '--stats');
    else if (input.toLowerCase().startsWith('/help')) finalArgs = input.replace('/help', '--help');

    const isSlash = input.startsWith('/');
    const finalSpawnCmd = isSlash 
      ? `chcp 65001 > nul && gemini ${finalArgs}`
      : `chcp 65001 > nul && gemini "${input.replace(/"/g, '\\"')}"`;

    const proc = spawn(finalSpawnCmd, [], { cwd, shell: true, env: { ...process.env, FORCE_COLOR: "3", TERM: "xterm-256color" } });
    agentData.proc = proc;

    proc.stdout.on('data', (data) => socket.emit('worker-terminal-output', { agentId, data: data.toString() }));
    proc.on('close', () => {
      agentData.proc = null;
      socket.emit('worker-agent-status', { agentId, status: 'idle' });
    });
  });

  socket.on('worker-restart-agent', ({ agentId, directory }) => {
    const data = processes.get(agentId);
    if (data && data.proc) {
      data.proc.kill();
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
    let targetDir = targetPath ? path.resolve(targetPath) : process.cwd();
    
    // Safety: If it's a drive root like "C:", ensure it has a trailing slash for readdir
    if (targetDir.length === 2 && targetDir.endsWith(':')) {
      targetDir += path.sep;
    }

    console.log(`[BROWSE REQUEST] Target: ${targetDir}`);
    try {
      if (!fs.existsSync(targetDir)) {
        throw new Error(`Directory does not exist: ${targetDir}`);
      }
      const items = fs.readdirSync(targetDir, { withFileTypes: true });
      const folders = items.filter(item => item.isDirectory()).map(item => item.name).sort();
      const files = items.filter(item => item.isFile()).map(item => item.name).sort();
      console.log(`[BROWSE SUCCESS] Found ${folders.length} folders and ${files.length} files.`);
      socket.emit('worker-browse-response', { requestId, data: { currentPath: targetDir, folders, files, parent: path.dirname(targetDir) } });
    } catch (err) {
      console.error(`[BROWSE ERROR] ${err.message}`);
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
    if (!fs.existsSync(filePath)) return socket.emit('worker-reflect-response', { requestId, error: "Skill file not found", agentId });

    const recentConversation = chatHistory.slice(-10).map(m => `${m.sender}: ${m.text}`).join('\n');
    const reflectionPrompt = `Based on our recent conversation below, what unique preferences, technical constraints, or "Lessons Learned" should you remember for next time? Provide exactly 3-4 bullet points starting with "-".\n\nCONVERSATION:\n${recentConversation}`;

    console.log(`[REFLECTING] Agent ${agentId} learning for skill ${skillId}...`);

    const proc = spawn('gemini', [`"${reflectionPrompt.replace(/"/g, '\\"')}"`], { shell: true, env: { ...process.env, FORCE_COLOR: "3", TERM: "xterm-256color" } });
    let reflection = '';
    proc.stdout.on('data', (data) => { reflection += data.toString(); });
    proc.on('close', (code) => {
      if (code === 0 && reflection.trim()) {
        // PERMANENT LEARNING: Append the reflection to the skill file
        const timestamp = new Date().toLocaleDateString();
        const learningEntry = `\n\n### 🧠 Lessons Learned (${timestamp})\n${reflection.trim()}\n`;
        try {
          fs.appendFileSync(filePath, learningEntry);
          socket.emit('worker-reflect-response', { requestId, success: true, reflection: reflection.trim(), agentId });
        } catch (err) {
          socket.emit('worker-reflect-response', { requestId, error: "Failed to save learning: " + err.message, agentId });
        }
      } else {
        socket.emit('worker-reflect-response', { requestId, error: "Reflection failed", agentId });
      }
    });
  });
}

start();
