<img 
  alt="image" 
  style="display: block; margin: 0 auto; max-width: 30%; height: 30%;" 
  src="https://github.com/user-attachments/assets/b87cfddb-2cd6-46e8-bbf1-55dc1a899ea1" 
  />


# 🤖 CLI Agents HQ

An interactive, high-fidelity orchestration dashboard for managing multiple Gemini CLI agents. This app transforms your desktop into a professional multi-agent command center with persistent memory, team collaboration, and a dynamic office ecosystem.

<img 
  alt="image" 
  style="display: block; margin: 0 auto; max-width: 30%; height: 30%;" 
  src="https://github.com/user-attachments/assets/23565329-8e42-4d74-adbf-c49d4880c5a2" 
  />

## 🎮 How to Use

1. **Hire & Assign:** Hire agents and click their desks to assign specialized roles.
2. **Set the Brief:** Use **📋 BRIEF** in the header to set global project rules.
3. **Assign Folders:** Use the **Files** tab on an agent's card to lock them into a specific directory. Look for the **✅ SAVED!** confirmation.
4. **Collaborate:** Click **🤝 CONFERENCE** to start a multi-specialist brainstorm.
5. **Level Up:** Use the **✨ Reflect** button to help agents learn and gain XP. Senior agents get upgraded workstations!
6. **Lounge Management:** Use the **☕ LOUNGE** to manage off-duty agents. You can recall multiple agents in batch before closing the lounge.
7. **System Diagnostics:** Access the **📟 Logs** modal for real-time tracking of agent activity and error handling.


<img 
  alt="image" 
   style="display: block; margin: 0 auto; max-width: 30%; height: 30%;" 
   src="https://github.com/user-attachments/assets/046c1b3c-506f-4b44-99ec-6d250f7624e7" 
   />
<img 
   alt="image" 
   style="display: block; margin: 0 auto; max-width: 30%; height: 30%;" 
   src="https://github.com/user-attachments/assets/492336ef-f23c-4938-bcfa-b1cc546da2a5" 
   />
<img
   alt="image" 
   style="display: block; margin: 0 auto; max-width: 30%; height: 30%;" 
   src="https://github.com/user-attachments/assets/251863dc-e3c2-4627-ab03-1c37154bcb57" 
   />





## 🚀 Key Features

- **Isometric 3D Office Floor:** A tactile command center with a 3D perspective, realistic textures, and dynamic lighting that shifts between **Day & Night Mode** based on your local time.
- **🤝 Conference Room (Collaboration):** Bring multiple specialists together. Start group discussions where agents collaborate and build upon each other's ideas in a shared context.
- **📋 Project Brief (Global Context):** Define your project's rules, tech stack, and goals once. The brief is automatically sent to every agent, ensuring project-wide consistency.
- **🗄️ Knowledge Vault:** A searchable floating modal to save frequently used snippets, database schemas, or documentation. Instantly "feed" these snippets into any agent's brain.
- **🎖️ Rank & XP System:** Agents gain experience (XP) through interaction and reflection. Watch them level up from Junior to **Senior** status, unlocking visual workstation upgrades like **Dual Monitors** and **Glowing Golden Borders**.
- **📁 Smart Directory Scoping:** Assign agents to specific folders with high-precision path joining. Features real-time visual feedback for directory locks, ensuring agents persist their work exactly where directed.
- **"Reflect & Learn" (Persistent Memory):** Agents analyze your sessions to learn your specific preferences, saving "Lessons Learned" directly into their portable skill files.
- **Skill Library:** 12+ specialized roles (Architect, Bug Hunter, Security Auditor, etc.) with advanced personalities and core competencies.
- **Unified Command UI:** Professional "Cyber Glass" interface with backdrop blurring and smooth **Framer Motion** animations. All secondary facilities (Lounge, Vault, Logs) are centralized into instant-access floating modals, keeping you focused on the main workspace.
- **Interactive Cyber Terminal:** Real-time access to raw CLI output with CRT effects and bi-directional `stdin`. Supports **Slash Commands** (e.g., `/stats`, `/help`) for direct CLI interaction.
- **Customizable Ports:** Defaulted to non-standard ports (**5501** for Dev, **5500** for Prod) to avoid common port conflicts.

## 🛠️ Architecture

- **Backend:** Node.js + Express + Socket.io.
- **Frontend:** React + TypeScript + Vite + Framer Motion.
- **Bridge-Ready:** Hybrid support for local execution or remote worker connections.
- **Persistence Layer:** Reliable state management (`data.json`) ensuring chat histories, agent levels, and directories are never lost.
- **Locale Optimization:** Integrated UTF-8 (chcp 65001) forcing for stable operation across all Windows environment settings.

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
Open [http://localhost:5501](http://localhost:5501) (Dev) or [http://localhost:5500](http://localhost:5500) (Prod).
---
*Built for the next generation of AI-driven development.*
