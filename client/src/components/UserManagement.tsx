import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Trash2, Edit2, Shield, X } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'User';
}

interface UserManagementProps {
  token: string;
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ token, onClose }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'User' as 'Admin' | 'User' });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: { 'Authorization': token } });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (e) { setError('Failed to fetch users'); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddForm(false);
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', role: 'User' });
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Operation failed');
      }
    } catch (e) { setError('Connection error'); }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': token } });
      if (res.ok) fetchUsers();
      else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) { alert('Failed to delete'); }
  };

  return (
    <div className="glass-modal" style={overlayStyle} onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={modalStyle}
        onClick={e => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} />
            <h3 style={{ margin: 0 }}>Identity & Access Management</h3>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        <div style={contentStyle}>
          <div style={toolbarStyle}>
            <button 
              onClick={() => { setShowAddForm(true); setEditingUser(null); }}
              style={addBtnStyle}
            >
              <UserPlus size={16} /> ADD NEW USER
            </button>
          </div>

          {error && <p style={{ color: '#e74c3c', fontSize: '13px' }}>{error}</p>}

          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>USER</th>
                  <th style={thStyle}>EMAIL</th>
                  <th style={thStyle}>ROLE</th>
                  <th style={thStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={trStyle}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={avatarCircle}>{u.username[0]}</div>
                        {u.username}
                      </div>
                    </td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>
                      <span style={{ 
                        ...roleBadge, 
                        backgroundColor: u.role === 'Admin' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
                        color: u.role === 'Admin' ? '#e74c3c' : '#3498db'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => { 
                          setEditingUser(u); 
                          setFormData({ ...formData, username: u.username, email: u.email, role: u.role });
                          setShowAddForm(true);
                        }} style={iconBtn}><Edit2 size={14} /></button>
                        <button onClick={() => deleteUser(u.id)} style={iconBtn}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showAddForm && (
          <div style={overlayStyle} onClick={() => setShowAddForm(false)}>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={formModalStyle}
              onClick={e => e.stopPropagation()}
            >
              <h4>{editingUser ? 'Edit User' : 'Create New User'}</h4>
              <form onSubmit={handleSubmit} style={formStyle}>
                <input 
                  placeholder="Username" 
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  style={inputStyle} required
                />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={inputStyle} required
                />
                <input 
                  type="password" 
                  placeholder={editingUser ? "Leave blank to keep current" : "Password"}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={inputStyle} required={!editingUser}
                />
                <select 
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  style={{...inputStyle, backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff'}}
                >
                  <option value="User" style={{background: '#24273a'}}>Standard User</option>
                  <option value="Admin" style={{background: '#24273a'}}>Administrator</option>
                </select>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" style={saveBtn}>{editingUser ? 'SAVE CHANGES' : 'CREATE USER'}</button>
                  <button type="button" onClick={() => setShowAddForm(false)} style={cancelBtn}>CANCEL</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalStyle: React.CSSProperties = { width: '800px', height: '600px', background: '#1a1b26', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)' };
const headerStyle: React.CSSProperties = { padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' };
const contentStyle: React.CSSProperties = { padding: '30px', flexGrow: 1, overflowY: 'auto' };
const toolbarStyle: React.CSSProperties = { marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' };
const addBtnStyle: React.CSSProperties = { padding: '10px 20px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const tableContainer: React.CSSProperties = { background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '13px' };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '15px', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px' };
const trStyle: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.05)' };
const tdStyle: React.CSSProperties = { padding: '15px' };
const avatarCircle: React.CSSProperties = { width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' };
const roleBadge: React.CSSProperties = { padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold' };
const closeBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' };
const iconBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'color 0.2s' };

const formModalStyle: React.CSSProperties = { width: '400px', padding: '30px', background: '#24273a', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' };
const saveBtn: React.CSSProperties = { flexGrow: 1, padding: '12px', background: '#3498db', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtn: React.CSSProperties = { padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' };

export default UserManagement;
