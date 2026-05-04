// Mocking the check logic from server.js
const requiredEnv = ['JWT_SECRET', 'CLI_AGENTS_SECRET_KEY'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  console.log(`PASS: Detected missing vars: ${missingEnv.join(', ')}`);
  process.exit(0);
} else {
  console.log('FAIL: Did not detect missing vars');
  process.exit(1);
}
