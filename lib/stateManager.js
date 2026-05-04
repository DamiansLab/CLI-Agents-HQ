const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data.json');

let state = { 
  workstations: new Array(10).fill(null), 
  breakRoomAgents: [], 
  logs: [], 
  globalContext: "", 
  knowledgeVault: [] 
};

const loadState = () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      if (data.trim() !== '') state = JSON.parse(data);
    }
  } catch (e) {}
  return state;
};

const saveState = (s) => { 
  state = s; 
  fs.writeFileSync(dataFilePath, JSON.stringify(s, null, 2)); 
};

const getState = () => state;

module.exports = {
  loadState,
  saveState,
  getState
};
