// Mock routing logic from server.js
const workers = new Map();
const agentToWorker = new Map();

const getWorkerForAgent = (agentId) => {
  const socketId = agentToWorker.get(agentId);
  if (socketId && workers.has(socketId)) return workers.get(socketId);
  
  const worker = Array.from(workers.values())[0];
  if (worker && agentId) agentToWorker.set(agentId, worker.id);
  return worker;
};

// Simulation
workers.set('worker-1', { id: 'worker-1', name: 'Worker One' });
workers.set('worker-2', { id: 'worker-2', name: 'Worker Two' });

console.log('--- Test 1: Assignment ---');
const wA = getWorkerForAgent('agent-A');
console.log(`Agent A assigned to: ${wA.id}`);

console.log('\n--- Test 2: Stickiness ---');
// Even if we have multiple workers, Agent A should stay on Worker 1
const wA2 = getWorkerForAgent('agent-A');
console.log(`Agent A still on: ${wA2.id}`);

console.log('\n--- Test 3: New Agent ---');
// Agent B will currently also go to Worker 1 because it's first in the list
// (We haven't implemented load balancing, just routing)
const wB = getWorkerForAgent('agent-B');
console.log(`Agent B assigned to: ${wB.id}`);

console.log('\n--- Test 4: Disconnect Recovery ---');
workers.delete('worker-1');
// Agent A should now move to Worker 2
const wA3 = getWorkerForAgent('agent-A');
console.log(`Agent A moved to: ${wA3 ? wA3.id : 'none'}`);

if (wA.id === 'worker-1' && wA2.id === 'worker-1' && wA3.id === 'worker-2') {
  console.log('\nPASS: Routing logic behaves as expected.');
} else {
  console.log('\nFAIL: Routing logic issue.');
}
