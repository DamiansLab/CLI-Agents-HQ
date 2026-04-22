# 🤖 CLI Agents HQ

An interactive orchestration dashboard for managing multiple Gemini CLI agents connected directly to your local machine. This app transforms your desktop into an agent command center, where each agent is an independent Gemini process with its own persona and memory.

## 🚀 Features

- **Autonomous Draggable Cards:** Chat windows pop up as independent, draggable cards. Chat with multiple agents simultaneously!
- **Skill Library (Specialized Roles):** Assign agents specific roles like **Senior Architect**, **Bug Hunter**, **UI Designer**, **SEO Expert**, and more. Logic is stored in portable `.md` files in the `/skills` folder.
- **"Reflect & Learn" (Long-Term Memory):** Agents can analyze conversations to learn your preferences and technical constraints, saving "Lessons Learned" directly into their skill files.
- **Interactive Full-View Terminal:** Real-time access to the raw Gemini CLI output with bi-directional `stdin` support.
- **Persistent Logs:** Both Chat and Terminal histories are saved automatically to `data.json`. Global system events are tucked away in a dedicated **System Logs** modal.
- **Smart Prompt Detection:** Automatically detects when the CLI is waiting for your input (Y/N, selections, or numbered lists) and notifies you in the chat.
- **Real-Time Context Feeding:** Use the built-in file browser (📂) to "feed" local file contents directly into an agent's context.

## 🛠️ Architecture

- **Backend:** Node.js + Express + Socket.io.
- **Frontend:** React + TypeScript + Vite.
- **Skill Engine:** A folder-based logic system (`/skills/*.md`) that primes the Gemini CLI with specific personas.
- **Learning Logic:** A reflection API that uses Gemini to summarize conversations and update the skill files.
- **Process Management:** `child_process.spawn` with full `stdin` piping for interactive CLI sessions.

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
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### Production Mode
```bash
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000).

## 🎮 How to Use

1. **Hire Agents:** Click "+ Hire New Agent" to fill empty workstations.
2. **Assign Roles:** Go to the **Profile** tab in the agent card and select a role (e.g., *Bug Hunter*).
3. **Chat & Monitor:**
   - Open the **Terminal** tab to see raw CLI output and provide manual input.
   - Use the **Chat** for natural conversation. Answer CLI prompts (like `y/n`) directly here!
4. **Teach your Agents:** After a productive conversation, click **✨ End Session & Reflect**. The agent will summarize what it learned and save it to its skill file.
5. **Set Context (📂):** 
   - Set the agent's working directory to your local project.
   - Click "Feed Context" on a file to send its content to the agent.
6. **System Diagnostics:** Click **📟 System Logs** in the header to view global events and errors.

---
*Built for local-first, multi-agent orchestration.*
