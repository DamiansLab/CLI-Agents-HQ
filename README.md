# 🤖 CLI Agents HQ

An interactive, high-fidelity orchestration dashboard for managing multiple Gemini CLI agents. This app transforms your desktop into a professional multi-agent command center with persistent memory, team collaboration, and a dynamic office ecosystem.

## 🚀 Key Features

- **Isometric 3D Office Floor:** A tactile command center with a 3D perspective, realistic textures, and dynamic lighting that shifts between **Day & Night Mode** based on your local time.
- **🤝 Conference Room (Collaboration):** Bring multiple specialists together. Start group discussions where agents collaborate and build upon each other's ideas in a shared context.
- **📋 Project Brief (Global Context):** Define your project's rules, tech stack, and goals once. The brief is automatically sent to every agent, ensuring project-wide consistency.
- **🗄️ Knowledge Vault:** Save frequently used snippets, database schemas, or documentation. Instantly "feed" these snippets into any agent's brain from their profile.
- **🎖️ Rank & XP System:** Agents gain experience (XP) through interaction and reflection. Watch them level up from Junior to **Senior** status, unlocking visual workstation upgrades like **Dual Monitors** and **Glowing Golden Borders**.
- **"Reflect & Learn" (Persistent Memory):** Agents analyze your sessions to learn your specific preferences, saving "Lessons Learned" directly into their portable skill files.
- **Skill Library:** 12+ specialized roles (Architect, Bug Hunter, Security Auditor, etc.) with advanced personalities and core competencies.
- **Glassmorphism UI:** Professional "Cyber Glass" interface with backdrop blurring, smooth **Framer Motion** animations, and **Lucide React** iconography. High-contrast dark themes for all modals ensure maximum readability.
- **Interactive Cyber Terminal:** Real-time access to raw CLI output with CRT effects and bi-directional `stdin`. Now supports **Slash Commands** (e.g., `/stats`, `/help`) for direct CLI interaction.

## 🛠️ Architecture

- **Backend:** Node.js + Express + Socket.io.
- **Frontend:** React + TypeScript + Vite + Framer Motion.
- **Engine:** Folder-based logic (`/skills/*.md`) and a persistence layer (`data.json`) for histories and XP.
- **Locale Optimization:** Integrated UTF-8 (chcp 65001) forcing for stable Windows operation across different language settings.

## 📥 Installation

1. **Prerequisites:**
   - [Gemini CLI](https://github.com/google/gemini-cli) installed globally and authenticated.
   - Node.js (v18+ recommended).

2. **Setup:**
   ```bash
   # Install all dependencies (root and client)
   npm install
   cd client
   npm install
   cd ..
   ```

## 🏃 Running the App

```bash
# Start both server and client in development mode
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

## 🎮 How to Use

1. **Hire & Assign:** Hire agents and click their desks or avatars to open the **Profile** card and assign specialized roles.
2. **Set the Brief:** Click **📋 PROJECT BRIEF** in the header to tell the team what you are building.
3. **Collaborate:** Click the **🤝 CONFERENCE ROOM** button to start a multi-agent brainstorm.
4. **Build the Vault:** Save core snippets in the **🗄️ VAULT** and feed them to agents via the **Profile** tab.
5. **Level Up:** Use the **✨ Reflect** button after conversations to help agents learn and gain XP. Senior agents get better equipment!
6. **Command Mode:** Use the **Terminal** tab for raw CLI interactions and slash-commands.
7. **Office Management:** Use the **☕ Staff Lounge** to bench agents (click to return them instantly) and **📟 System Logs** for diagnostics.

---
*Built for the next generation of AI-driven development.*
