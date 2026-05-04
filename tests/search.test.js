const stateManager = require('../lib/stateManager');

// Mock search logic
function searchVault(query) {
  const state = stateManager.loadState();
  if (!query) return state.knowledgeVault || [];
  
  return (state.knowledgeVault || []).filter(item => 
    (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
    (item.content && item.content.toLowerCase().includes(query.toLowerCase()))
  );
}

console.log('--- Test: Knowledge Vault Search ---');

// Mock some data
const mockState = {
  knowledgeVault: [
    { title: 'React Hooks', content: 'useEffect and useState are core.' },
    { title: 'Node.js Streams', content: 'Piping data efficiently.' },
    { title: 'Socket.io', content: 'Real-time communication.' }
  ]
};
stateManager.saveState(mockState);

const result1 = searchVault('react');
console.log(`Search "react": Found ${result1.length} results.`);

const result2 = searchVault('data');
console.log(`Search "data": Found ${result2.length} results.`);

const result3 = searchVault('socket');
console.log(`Search "socket": Found ${result3.length} results.`);

if (result1.length === 1 && result2.length === 1 && result3.length === 1) {
  console.log('PASS: Search logic works correctly.');
} else {
  console.log('FAIL: Search logic returned unexpected results.');
  process.exit(1);
}
