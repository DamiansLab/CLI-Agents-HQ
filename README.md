<img width="512" height="512" alt="android-chrome-512x512" src="https://github.com/user-attachments/assets/5b7033f8-108e-4a5b-810a-b51d98d385b1" />



# 🤖 CLI Agents HQ
### Secure, Multi-Agent Orchestration & Hybrid AI Dashboard

CLI Agents HQ is a professional management hub for your Gemini CLI agents. It transforms individual terminal interactions into a cohesive, team-based environment, allowing you to coordinate multiple AI specialists from a single, centralized command center.

---

<img width="1906" height="899" alt="581980719-251863dc-e3c2-4627-ab03-1c37154bcb57" src="https://github.com/user-attachments/assets/66e29e66-6cde-439b-a9b7-13701091c263" />


## 🎯 What the app does
CLI Agents HQ bridges the gap between powerful AI execution and intuitive team management. It allows you to:
- **Orchestrate specialized teams:** "Hire" multiple agents and assign them expert roles (Architect, Security Auditor, Test Engineer, etc.) from a library of custom skills.
- **Hybrid Local Execution:** Securely connect your local terminal to an online dashboard. Your agents have full access to your local project files, while their progress and "Lessons Learned" are synced to the cloud.
- **Collaborative Brainstorming:** Use the **Conference Room** to start group chats where specialists build upon each other's ideas to solve complex problems.
- **Unified Knowledge:** Feed a global **Project Brief** or specific **Knowledge Vault** snippets to your entire team simultaneously.
- **Persistent Evolution:** Agents gain XP and level up from Junior to Senior as they "Reflect & Learn" from your conversations, saving new insights permanently to their skill files.


<img width="2440" height="1021" alt="581986525-23565329-8e42-4d74-adbf-c49d4880c5a2" src="https://github.com/user-attachments/assets/6130c541-84fe-42d0-86e6-f5b15b8bd2dd" />
<img width="1911" height="894" alt="581976571-b87cfddb-2cd6-46e8-bbf1-55dc1a899ea1" src="https://github.com/user-attachments/assets/05b23980-edf4-4460-9ed1-65cd057a3778" />
<img width="803" height="601" alt="581979914-046c1b3c-506f-4b44-99ec-6d250f7624e7" src="https://github.com/user-attachments/assets/e9d8261e-327f-4798-8002-8714eb2ddb07" />
<img width="857" height="603" alt="581980055-492336ef-f23c-4938-bcfa-b1cc546da2a5" src="https://github.com/user-attachments/assets/bd7858aa-27e1-4998-89f9-f9e1a47ddf60" />

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
3. **Configuration:** You can set Environment Variables in Plesk or create a `.env` file in the root:
   - `CLI_AGENTS_SECRET_KEY`: A strong secret for the local machine "handshake".
   - `JWT_SECRET`: A random string used to secure user login sessions.
   - `PORT`: (Optional) The port the server will run on (default: 5500).
4. Run **NPM Install** and **Restart**.

### 2. Connect the Engine (Local)
You can use the pre-bundled **CLI Agents HQ Local** folder, or set it up manually.

**Using .env (New & Recommended)**
1. Create a `.env` file in your local folder (see `.env.example`).
2. Add your `SERVER_URL` and `CLI_AGENTS_SECRET_KEY`.
3. Run `node agent.js` to connect instantly.

**Option A: Automated (Legacy)**
1. Copy the `CLI Agents HQ Local` folder to your computer.
2. Run `npm install` and `node agent.js`.
3. Follow the interactive prompts to enter your URL and Secret.

---

## 🆕 Changelogs

### v1.6.0 (Unified Intelligence & Team Sync)
- **Env Support:** Integrated `dotenv` for seamless configuration via `.env` files.
- **Conference Room 2.0:** Complete UI redesign with a specialized sidebar and "Shared Memory" logic.
- **Shared Memory:** Agents in the Conference Room now "hear" each other by receiving the full room history.
- **Global Brief Integration:** The Project Brief is now automatically attached to every message (Individual & Team).
- **Interactive Help:** Added "💡 Help" buttons to Brief, Vault, and Conference Room for better onboarding.
- **Gamified Evolution:** Upgraded XP bars with smooth animations and added "Senior Status" visuals (Gold borders, sparkles, and dual-monitor icons) for Level 3+ agents.
- **Permanent Learning:** Fixed logic to ensure "Lessons Learned" are physically appended to your local skill markdown files.
- **Security:** Hardened `.gitignore` and added `.env.example` templates.
- **Bug Fixes:** Fixed socket relay logic for group messages and manual SEND button sync.

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
