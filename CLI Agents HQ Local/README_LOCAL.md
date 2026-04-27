
# 🤖 CLI Agents HQ: Local Engine Setup

This folder contains everything needed to link this computer to your online Dashboard.

## 🚀 Quick Start
1. **Install Dependencies:** Open a terminal in this folder and run:
   ```bash
   npm install
   ```

2. **Configure (Recommended):** 
   Create a `.env` file based on `.env.example` and add your `SERVER_URL` and `CLI_AGENTS_SECRET_KEY`. This bypasses manual prompts.

3. **Launch the Engine:**
   ```bash
   node agent.js
   ```

## 📁 What is in this folder?
- `agent.js`: The bridge between your terminal and the web dashboard. Supports `.env` and `.agent-config.json`.
- `skills/`: Contains the specialized logic for your agents (required for the Reflect/Learning function).
- `package.json`: Ensures you have the correct connection drivers installed (now including `dotenv`).
- `.env.example`: Template for your local configuration.

---
*Built for the next generation of secure, collaborative AI development.*
    