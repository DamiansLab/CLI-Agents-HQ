import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string, user: { username: string, role: string, email: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={boxStyle}
      >
        <div style={headerStyle}>
          <div style={logoCircle}>
            <ShieldCheck size={40} color="#3498db" />
          </div>
          <h2 style={{ margin: '10px 0 5px 0', color: '#fff' }}>CLI Agents HQ</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>SECURE ACCESS REQUIRED</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroup}>
            <User size={18} style={iconStyle} />
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={inputGroup}>
            <Lock size={18} style={iconStyle} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {error && <p style={errorStyle}>{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              ...buttonStyle, 
              background: loading ? '#2c3e50' : '#3498db',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#0a0b14', overflow: 'hidden'
};

const boxStyle: React.CSSProperties = {
  width: '380px', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
  display: 'flex', flexDirection: 'column', gap: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
};

const headerStyle: React.CSSProperties = { textAlign: 'center' };
const logoCircle: React.CSSProperties = {
  width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(52, 152, 219, 0.1)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
  border: '1px solid rgba(52, 152, 219, 0.3)'
};

const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const inputGroup: React.CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center' };
const iconStyle: React.CSSProperties = { position: 'absolute', left: '15px', color: 'rgba(255,255,255,0.3)' };

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none'
};

const buttonStyle: React.CSSProperties = {
  padding: '15px', borderRadius: '12px', border: 'none', color: '#fff', fontWeight: 'bold',
  fontSize: '14px', letterSpacing: '1px', transition: 'all 0.2s', marginTop: '10px'
};

const errorStyle: React.CSSProperties = { color: '#e74c3c', fontSize: '13px', textAlign: 'center', margin: 0 };

export default Login;
