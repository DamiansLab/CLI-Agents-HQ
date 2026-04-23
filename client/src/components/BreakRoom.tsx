import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, LogIn } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
}

interface BreakRoomProps {
  agents: Agent[];
  onClose: () => void;
  onReturnAgent: (agent: Agent) => void;
}

const BreakRoom: React.FC<BreakRoomProps> = ({ agents, onClose, onReturnAgent }) => {
  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={modalContentStyle}
        onClick={e => e.stopPropagation()}
        className="glass-modal"
      >
        {/* Header - Matching Brief Style */}
        <div style={{ ...modalHeaderStyle, backgroundColor: '#795548' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coffee size={20} />
            <h3 style={{ margin: 0 }}>☕ Staff Lounge</h3>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <div style={bodyStyle}>
          <p style={subHeaderStyle}>
            Agents currently relaxing and recharging. Click an agent to call them back to their workstation.
          </p>
          
          {agents.length === 0 ? (
            <div style={emptyStyle}>
              <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.2 }}>🛋️</div>
              <p style={{ opacity: 0.5, fontSize: '14px' }}>The lounge is currently empty. Everyone is hard at work!</p>
            </div>
          ) : (
            <div style={agentsGridStyle}>
              {agents.map(agent => (
                <div 
                  key={agent.id} 
                  onClick={() => onReturnAgent(agent)}
                  style={agentPillStyle}
                  className="agent-pill-hover"
                >
                  <span style={{ fontSize: '28px' }}>{agent.avatar || "👨‍💼"}</span>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{agent.name}</div>
                    <div style={{ fontSize: '10px', color: '#8d6e63' }}>OFF-DUTY</div>
                  </div>
                  <LogIn size={16} style={{ opacity: 0.4 }} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={footerStyle}>
          <button onClick={onClose} style={primaryBtnStyle}>CLOSE LOUNGE</button>
        </div>
      </motion.div>
    </div>
  );
};

// Modal Styles to match App.tsx & KnowledgeVault
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#1a1c2c', borderRadius: '15px', width: '600px', maxWidth: '95%', height: '500px',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.1)'
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: '1'
};

const bodyStyle: React.CSSProperties = { 
  flexGrow: 1, 
  padding: '30px', 
  overflowY: 'auto', 
  background: 'rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column'
};

const subHeaderStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '25px',
  lineHeight: '1.5',
  textAlign: 'center'
};

const agentsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '15px'
};

const agentPillStyle: React.CSSProperties = {
  padding: '15px 20px',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  transition: 'all 0.2s ease'
};

const emptyStyle: React.CSSProperties = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center'
};

const footerStyle: React.CSSProperties = {
  padding: '20px',
  borderTop: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  justifyContent: 'center'
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 30px',
  background: '#795548',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

export default BreakRoom;
