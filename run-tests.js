const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testsDir = path.join(__dirname, 'tests');
const testFiles = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));

let total = testFiles.length;
let passed = 0;

console.log(`\x1b[1m\x1b[34m[TEST RUNNER] Running ${total} test suites...\x1b[0m\n`);

testFiles.forEach(file => {
  const start = Date.now();
  // We use pwsh for the safety test to clear env vars, or just run it directly
  // The safety test specifically needs a clean env
  const result = spawnSync('node', [path.join(testsDir, file)], {
    env: { ...process.env, JWT_SECRET: '', CLI_AGENTS_SECRET_KEY: '' }, // Simulate clean env for safety test
    stdio: 'pipe',
    encoding: 'utf8'
  });

  const duration = Date.now() - start;
  
  if (result.status === 0) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${file} (${duration}ms)`);
    passed++;
  } else {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${file} (${duration}ms)`);
    console.log(`\x1b[33m--- Output ---\x1b[0m\n${result.stdout}${result.stderr}\x1b[33m--------------\x1b[0m\n`);
  }
});

console.log(`\n\x1b[1mResult: ${passed}/${total} passed.\x1b[0m`);

if (passed < total) process.exit(1);
