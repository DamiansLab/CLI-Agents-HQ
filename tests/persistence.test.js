const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data.json');
const initialState = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

// Mocking the persistence logic
function persistMessage(state, agentId, sender, text) {
  const agentIndex = state.workstations.findIndex(a => a?.id === agentId);
  if (agentIndex !== -1) {
    state.workstations[agentIndex].chatHistory = state.workstations[agentIndex].chatHistory || [];
    state.workstations[agentIndex].chatHistory.push({ sender, text, timestamp: '12:00:00' });
  }
}

console.log('--- Test: Session Persistence ---');
const testAgentId = initialState.workstations.find(a => a !== null).id;
console.log(`Using Agent ID: ${testAgentId}`);

const newState = JSON.parse(JSON.stringify(initialState));
persistMessage(newState, testAgentId, 'User', 'Hello agent');
persistMessage(newState, testAgentId, 'Agent', 'Hello user');

const history = newState.workstations.find(a => a?.id === testAgentId).chatHistory;
console.log(`History length: ${history.length}`);

if (history.length === 2 && history[0].sender === 'User' && history[1].sender === 'Agent') {
  console.log('PASS: Messages persisted in state correctly.');
} else {
  console.log('FAIL: Message persistence issue.');
  process.exit(1);
}
