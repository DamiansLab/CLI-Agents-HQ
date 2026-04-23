<img 
  alt="image" 
  style="display: block; margin: 0 auto; max-width: 30%; height: 30%;" 
  src="/favicon_CLI_AGENTS/android-chrome-512x512.png" 
  />


# 🤖 CLI Agents HQ
### Secure, Multi-Agent Orchestration & Hybrid AI Dashboard

CLI Agents HQ is a professional management hub for your Gemini CLI agents. It transforms individual terminal interactions into a cohesive, team-based environment, allowing you to coordinate multiple AI specialists from a single, centralized command center.

---

## 🎯 What the app does
CLI Agents HQ bridges the gap between powerful AI execution and intuitive team management. It allows you to:
- **Orchestrate specialized teams:** "Hire" multiple agents and assign them expert roles (Architect, Security Auditor, Test Engineer, etc.) from a library of custom skills.
- **Hybrid Local Execution:** Securely connect your local terminal to an online dashboard. Your agents have full access to your local project files, while their progress and "Lessons Learned" are synced to the cloud.
- **Collaborative Brainstorming:** Use the **Conference Room** to start group chats where specialists build upon each other's ideas to solve complex problems.
- **Unified Knowledge:** Feed a global **Project Brief** or specific **Knowledge Vault** snippets to your entire team simultaneously.
- **Persistent Evolution:** Agents gain XP and level up from Junior to Senior as they "Reflect & Learn" from your conversations, saving new insights permanently to their skill files.

---

## 🚀 How to Connect & Use

### 🔐 Default Login Credentials
Upon first deployment, use these credentials to access the dashboard:
- **Username:** `Admin`
- **Password:** `admin123`
- *⚠️ IMPORTANT: Change your password in the **👥 USERS** menu immediately after logging in.*

### 1. Deploy the HQ (Server)
1. Upload the `deploy-ready` folder to your Plesk server.
2. In Plesk Node.js settings, set `entry.js` as the startup file.
3. Add these **Environment Variables** in Plesk:
   - `CLI_AGENTS_SECRET_KEY`: A strong secret for the local machine "handshake".
   - `JWT_SECRET`: A random string used to secure user login sessions.
4. Run **NPM Install** and **Restart**.

### 2. Connect the Engine (Local)
You can use the pre-bundled **CLI Agents HQ Local** folder, or set it up manually:

**Option A: Automated (Recommended)**
1. Copy the `CLI Agents HQ Local` folder to your computer.
2. Run `npm install` and `node agent.js`.

**Option B: Manual Setup**
1. Create a new folder on your computer.
2. Copy `agent.js`, `package.json`, and the `skills/` folder into it.
3. Run `npm install` and `node agent.js`.

**The Handshake:** Follow the interactive prompts to enter your Dashboard URL and the `CLI_AGENTS_SECRET_KEY` you defined on the server.

---

## 🆕 Changelogs

### v1.5.2 (Complete Branding & Quick-Connect)
- **Instant Setup:** New **🔌 CONNECT** button provides an auto-generated setup guide.
- **Branding:** Full transition to **CLI Agents HQ** with high-res logos and assets.
- **Stability:** Migrated all local machine interactions to high-stability Socket.io tunnels.

### v1.5.1 (Secure Hybrid Mode)
- **Security:** Integrated JWT-based login system and role-based user management.
- **Hybrid Logic:** Dashboard stores state online while execution remains strictly local.
- **UI UX:** Added Full-Screen focus mode and real-time tab notifications.

---
*Built for the next generation of secure, collaborative AI development.*
