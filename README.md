# 🤖 CLI Agents HQ

An interactive, high-fidelity orchestration dashboard for managing multiple Gemini CLI agents. This app transforms your desktop into a professional multi-agent command center with persistent memory, team collaboration, and a dynamic office ecosystem.

## 🚀 Key Features

- **Isometric 3D Office Floor:** A tactile command center with a 3D perspective, realistic textures, and dynamic lighting that shifts between **Day & Night Mode** based on your local time.
- **🤝 Conference Room (Collaboration):** Bring multiple specialists together. Start group discussions where agents collaborate and build upon each other's ideas in a shared context.
- **📋 Project Brief (Global Context):** Define your project's rules, tech stack, and goals once. The brief is automatically sent to every agent, ensuring project-wide consistency.
- **🗄️ Knowledge Vault:** A searchable floating modal to save frequently used snippets, database schemas, or documentation. Instantly "feed" these snippets into any agent's brain.
- **🎖️ Rank & XP System:** Agents gain experience (XP) through interaction and reflection. Watch them level up from Junior to **Senior** status, unlocking visual workstation upgrades like **Dual Monitors** and **Glowing Golden Borders**.
- **📁 Smart Directory Scoping:** Assign agents to specific folders. They will now correctly initialize and persist their work within their assigned directory across Chat and Terminal sessions.
- **"Reflect & Learn" (Persistent Memory):** Agents analyze your sessions to learn your specific preferences, saving "Lessons Learned" directly into their portable skill files.
- **Skill Library:** 12+ specialized roles (Architect, Bug Hunter, Security Auditor, etc.) with advanced personalities and core competencies.
- **Glassmorphism UI:** Professional "Cyber Glass" interface with backdrop blurring, smooth **Framer Motion** animations, and **Lucide React** iconography.
- **Unified Navigation:** All secondary facilities (Staff Lounge, Knowledge Vault, System Logs) are now accessible as instant-access floating modals, keeping you focused on the main Engineering floor.
- **Interactive Cyber Terminal:** Real-time access to raw CLI output with CRT effects and bi-directional `stdin`. Supports **Slash Commands** (e.g., `/stats`, `/help`) for direct CLI interaction.

## 🛠️ Architecture

- **Backend:** Node.js + Express + Socket.io.
- **Frontend:** React + TypeScript + Vite + Framer Motion.
- **Bridge-Ready:** Support for both local execution and remote worker connection.
- **Persistence Layer:** Reliable state management (`data.json`) ensuring chat histories and agent progress are never lost during updates.
- **Locale Optimization:** Integrated UTF-8 (chcp 65001) forcing for stable Windows operation.

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

# Or build for production and run
cd client && npm run build && cd ..
node server.js
```
Open [http://localhost:5173](http://localhost:5173) (Dev) or [http://localhost:3000](http://localhost:3000) (Prod).

## 🎮 How to Use

1. **Hire & Assign:** Hire agents and click their desks to assign specialized roles.
2. **Set the Brief:** Use **📋 BRIEF** in the header to set global project rules.
3. **Assign Folders:** Use the **Files** tab on an agent's card to lock them into a specific working directory.
4. **Collaborate:** Click **🤝 CONFERENCE** to start a multi-specialist brainstorm.
5. **Level Up:** Use the **✨ Reflect** button to help agents learn and gain XP. Senior agents get upgraded workstations!
6. **Lounge & Logs:** Use the **☕ LOUNGE** to manage off-duty agents and **📟 Logs** for real-time system diagnostics.

---
*Built for the next generation of AI-driven development.*
