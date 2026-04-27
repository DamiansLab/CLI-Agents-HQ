const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function prepare() {
    const rootDir = process.cwd();
    const deployDir = path.join(rootDir, 'deploy-ready');

    console.log('🚀 Preparing Zero-Auth Hybrid Deployment for Plesk...');

    // 1. Build the client
    console.log('📦 Building React client...');
    try {
        execSync('cd client && npm install && npm run build', { stdio: 'inherit' });
    } catch (err) {
        console.error('❌ Client build failed. Please check for TypeScript or Lint errors.');
        process.exit(1);
    }

    // 2. Clean/Create deploy-ready folder
    fs.emptyDirSync(deployDir);

    // ... (Backend and client copying logic)

    // 3. Copy Backend files
    console.log('📂 Copying backend files...');
    const filesToCopy = [
        'server.js',
        'package.json',
        'package-lock.json',
        'data.json',
        'skills',
        '.env.example'
    ];

    filesToCopy.forEach(file => {
        const src = path.join(rootDir, file);
        const dest = path.join(deployDir, file);
        if (fs.existsSync(src)) {
            fs.copySync(src, dest);
        }
    });

    // 4. Copy Built Client
    console.log('📂 Copying built client...');
    fs.copySync(path.join(rootDir, 'client/dist'), path.join(deployDir, 'client/dist'));

    // 6. Create Local Machine Package
    console.log('📦 Creating Local Machine Package...');
    const localPackageDir = path.join(rootDir, 'CLI Agents HQ Local');
    fs.emptyDirSync(localPackageDir);

    const localFiles = ['agent.js', 'package.json', 'package-lock.json', 'skills', '.env.example'];
    localFiles.forEach(file => {
        const src = path.join(rootDir, file);
        const dest = path.join(localPackageDir, file);
        if (fs.existsSync(src)) fs.copySync(src, dest);
    });

    // 7. Create Local Instructions
    const localReadme = `
# 🤖 CLI Agents HQ: Local Engine Setup

This folder contains everything needed to link this computer to your online Dashboard.

## 🚀 Quick Start
1. **Install Dependencies:** Open a terminal in this folder and run:
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure (Recommended):** 
   Create a \`.env\` file based on \`.env.example\` and add your \`SERVER_URL\` and \`CLI_AGENTS_SECRET_KEY\`. This bypasses manual prompts.

3. **Launch the Engine:**
   \`\`\`bash
   node agent.js
   \`\`\`

## 📁 What is in this folder?
- \`agent.js\`: The bridge between your terminal and the web dashboard. Supports \`.env\` and \`.agent-config.json\`.
- \`skills/\`: Contains the specialized logic for your agents (required for the Reflect/Learning function).
- \`package.json\`: Ensures you have the correct connection drivers installed (now including \`dotenv\`).
- \`.env.example\`: Template for your local configuration.

---
*Built for the next generation of secure, collaborative AI development.*
    `;
    fs.writeFileSync(path.join(localPackageDir, 'README_LOCAL.md'), localReadme);

    console.log('\n✅ DEPLOYMENT READY!');
    console.log('--------------------------------------------------');
    console.log('1. Upload the contents of "deploy-ready" to Plesk.');
    console.log('2. Add "CLI Agents HQ Local" to your local project folder.');
    console.log('3. Follow README_LOCAL.md to connect.');
    console.log('--------------------------------------------------');
}

prepare();
