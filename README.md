# 🤖 CLI Agents HQ

An interactive orchestration dashboard for managing multiple Gemini CLI agents connected directly to your local machine. This app transforms your desktop into an agent command center, where each agent is an independent Gemini process.

## 🚀 Features

- **Autonomous Draggable Cards:** Chat windows pop up as independent, draggable cards. Chat with multiple agents simultaneously!
- **Persistent Chat Memory:** Every agent remembers their conversation history. Messages are saved automatically to `data.json`.
- **Real-Time Context Feeding:** Use the file browser (📂) to not only set working directories but to "feed" specific local files directly into an agent's context.
- **Task-Based CLI Integration:** Optimized for Windows reliability. Spawns fresh `gemini` processes per message to ensure no-hang performance.
- **Process Control:** Dedicated **Force Restart** (🔄) to unstick processes and **Clear Chat** (🗑️) to reset agent memory.
- **Live Diagnostics:** High-fidelity terminal logs and a visual status bar (Thinking 🟡, Idle 🟢, Offline ⚪) for every agent.

## 🛠️ Architecture

- **Backend:** Node.js + Express + Socket.io.
- **Frontend:** React + TypeScript + Vite.
- **Process Management:** Surgical use of `child_process.spawn` to pipe stdin/stdout to the local `gemini` CLI.
- **State Persistence:** Flat-file JSON database (`data.json`) stores agent positions, names, and chat histories.

## 📥 Installation

1. **Prerequisites:**
   - [Gemini CLI](https://github.com/google/gemini-cli) installed globally and authenticated (`gemini help`).
   - Node.js (v18+ recommended).

2. **Setup:**
   ```bash
   # Install all dependencies (root and client)
   npm install
   cd client && npm install
   cd ..
   ```

## 🏃 Running the App

### Development Mode (Recommended)
This starts both the backend and the frontend with Hot Module Replacement (HMR).
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Mode
```bash
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000).

## 🎮 How to Use

1. **Hire Agents:** Click "Hire New Agent" to fill empty workstations.
2. **Set Context (📂):** 
   - Use the folder icon to set the agent's working directory.
   - Click "Feed Context" next to any file to send that file's content to the agent.
3. **Chat (💬):** Open an autonomous window. Drag it anywhere. Talk to the real Gemini CLI.
4. **Monitor (💻):** Check the raw CLI output in the Terminal tab for debugging.
5. **Manage Office:**
   - Use the **Break Room** to bench agents you aren't using.
   - Use **Clear Logs** in the system console to wipe global events.
   - Use **Force Restart** (🔄) if an agent process becomes unresponsive.

---
*Built for local-first, multi-agent orchestration.*
