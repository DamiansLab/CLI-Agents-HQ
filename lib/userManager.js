const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersFilePath = path.join(__dirname, '..', 'users.json');

let users = [];

const loadUsers = () => {
  if (fs.existsSync(usersFilePath)) {
    users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
  } else {
    const salt = bcrypt.genSaltSync(10);
    users = [{
      id: 'admin-1',
      username: 'Admin',
      email: 'admin@cli-agents.local',
      password: bcrypt.hashSync('admin123', salt),
      role: 'Admin'
    }];
    saveUsers();
  }
  return users;
};

const saveUsers = () => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

const getUsers = () => users;

const addUser = (userData) => {
  users.push({ 
    id: Math.random().toString(36).substr(2, 9), 
    ...userData,
    password: bcrypt.hashSync(userData.password, 10) 
  });
  saveUsers();
};

const updateUser = (id, updates) => {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    if (updates.password) updates.password = bcrypt.hashSync(updates.password, 10);
    users[index] = { ...users[index], ...updates };
    saveUsers();
    return true;
  }
  return false;
};

const deleteUser = (id) => {
  const originalLength = users.length;
  users = users.filter(u => u.id !== id);
  if (users.length !== originalLength) {
    saveUsers();
    return true;
  }
  return false;
};

module.exports = {
  loadUsers,
  getUsers,
  addUser,
  updateUser,
  deleteUser
};
