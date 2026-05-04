const crypto = require('crypto');

function getHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

console.log('--- Test: Content Hashing ---');

const content1 = 'Hello world';
const content2 = 'Hello world';
const content3 = 'Hello world!';

const hash1 = getHash(content1);
const hash2 = getHash(content2);
const hash3 = getHash(content3);

console.log(`Hash 1: ${hash1}`);
console.log(`Hash 2: ${hash2}`);
console.log(`Hash 3: ${hash3}`);

if (hash1 === hash2 && hash1 !== hash3) {
  console.log('PASS: Hashing is consistent and detects changes.');
} else {
  console.log('FAIL: Hashing issue.');
  process.exit(1);
}
