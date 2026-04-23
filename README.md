<img 
  alt="image" 
  style="display: block; margin: 0 auto; max-width: 30%; height: 30%;" 
  src="/favicon_CLI_AGENTS/android-chrome-512x512.png" 
  />


# 🤖 CLI Agents HQ

An interactive, high-fidelity orchestration dashboard for managing multiple Gemini CLI agents. Version 1.5.x introduces a **Secure Hybrid Architecture**, allowing you to host your "Command Center" online while keeping execution safely on your local machine.

---

## 🔐 Default Login Credentials
Upon first deployment, use these credentials to access the dashboard:
- **Username:** `Admin`
- **Password:** `admin123`
- *⚠️ IMPORTANT: Change your password and create your own users in the **👥 USERS** menu immediately after logging in.*

---

## 🆕 Changelog v1.5.2 (Complete Branding & Quick-Connect)
**Release Date: April 23, 2026**

### 🔌 Quick Connect Feature
- **Instant Setup Guide:** Added a new **🔌 CONNECT** button to the header.
- **Auto-Discovery:** The guide automatically identifies your dashboard's URL.
- **Secure Key Access:** Fetches your `CLI_AGENTS_SECRET_KEY` securely from the server for easy copy-pasting into your local terminal.

### 🛡️ Security & Identity
- **Full Branding:** Complete transition from "GCHQ" to **CLI Agents HQ** across all internal variables, folders, and local storage.
- **Role-Based Access:** Admins have exclusive access to the **👥 USERS** menu for managing the team.
- **Verification Bridge:** The local worker now authenticates using a matching `CLI_AGENTS_SECRET_KEY` defined in your Plesk environment.

### 🎨 UI/UX Enhancements
- **High-Res Visuals:** Updated all logos and favicons to 192x192 and 512x512 resolutions for crisp display on all screens.
- **Full-Screen Focus:** Maximize chat windows to handle long code blocks with ease.
- **Notification Sync:** Visual alerts clear automatically across the dashboard when messages are read.

---

## 🚀 How to Connect & Use

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
3. Run `npm install`.
4. Run `node agent.js` and follow the prompts.

### 3. Manage Your Team
- Hire agents and assign them specialist roles (Architect, Bug Hunter, etc.).
- The dashboard stores their **XP**, **Levels**, and **Lessons Learned** online, so your team is ready whenever you are.

---

## 🛠️ Architecture
- **Backend:** Node.js + Express + Socket.io + JWT (Secure Storage Hub).
- **Frontend:** React + TypeScript + Vite + Framer Motion.
- **Local Engine:** Node.js + `gemini-cli` (Terminal Control).

---
*Built for the next generation of secure, collaborative AI development.*
