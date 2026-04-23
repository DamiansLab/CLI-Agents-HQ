import React from 'react';
import { Folder, Terminal, MessageSquare, Monitor } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  hasNotification?: boolean;
  status?: 'idle' | 'thinking' | 'offline';
  xp?: number;
  level?: number;
}

interface WorkstationProps {
  id: number;
  agent: Agent | null;
  onClick: (agent: Agent, view?: 'profile' | 'terminal' | 'chat' | 'folder') => void;
}

const Workstation: React.FC<WorkstationProps> = ({ id, agent, onClick }) => {
  return (
    <div 
      className="workstation-card"
      onClick={() => agent && onClick(agent, 'profile')}
      style={{
        padding: '15px',
        width: '180px',
        height: '240px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(145deg, #2c3e50, #34495e)',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
        position: 'relative',
        border: (agent && (agent.level || 1) >= 3) ? '2px solid #f1c40f' : '1px solid rgba(255,255,255,0.05)',
        cursor: agent ? 'pointer' : 'default',
      }}
    >
      {/* Senior Setup (Dual Monitors) */}
      {agent && (agent.level || 1) >= 3 && (
        <div style={{ position: 'absolute', top: '10px', left: '15px', display: 'flex', gap: '2px', opacity: 0.5 }}>
          <Monitor size={10} color="#f1c40f" />
          <Monitor size={10} color="#f1c40f" />
        </div>
      )}
      {/* Station Label */}
      <div style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 'bold',
        marginBottom: '15px',
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        Station {id + 1}
      </div>

      {agent ? (
        <>
          {/* Level Badge */}
          <div style={{
            position: 'absolute',
            top: '35px',
            right: '15px',
            background: (agent.level || 1) >= 3 ? 'linear-gradient(135deg, #f1c40f, #f39c12)' : '#3498db',
            color: '#fff',
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}>
            LVL {agent.level || 1}
          </div>

          {/* Avatar with Pulsing Ring */}
          <div 
            className={`agent-avatar-clickable ${agent.status === 'thinking' ? 'status-pulse-thinking' : agent.status === 'idle' ? 'status-pulse-idle' : ''}`}
            style={{ 
              fontSize: '48px',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              marginBottom: '12px',
              position: 'relative',
            }}
          >
            {agent.avatar || "👨‍💼"}
          </div>

          {/* XP Bar */}
          <div style={{
            width: '100px',
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            marginBottom: '15px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(agent.xp || 0) % 300 / 3}%`,
              height: '100%',
              background: '#3498db',
              boxShadow: '0 0 10px #3498db'
            }} />
          </div>

          <p style={{ 
            fontWeight: '600', 
            margin: '0 0 15px 0', 
            textAlign: 'center',
            fontSize: '15px',
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
          }}>
            {agent.name}
          </p>
          
          {/* Tools Grid */}
          <div style={{
            marginTop: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            width: '100%',
            padding: '10px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
          }}>
            <button 
              className="tool-btn"
              onClick={(e) => { e.stopPropagation(); onClick(agent, 'folder'); }}
              title="Directory" 
              style={toolBtnStyle}
            ><Folder size={16} /></button>
            <button 
              className="tool-btn"
              onClick={(e) => { e.stopPropagation(); onClick(agent, 'terminal'); }}
              title="Terminal" 
              style={toolBtnStyle}
            ><Terminal size={16} /></button>
            <button 
              className="tool-btn"
              onClick={(e) => { e.stopPropagation(); onClick(agent, 'chat'); }}
              title="Chat" 
              style={{ ...toolBtnStyle, position: 'relative' }}
            >
              <MessageSquare size={16} />
              {agent.hasNotification && (
                <span className="notif-dot" style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#e74c3c',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px #e74c3c'
                }}></span>
              )}
            </button>
          </div>
        </>
      ) : (
        <div style={{ 
          marginTop: '40px',
          opacity: 0.2,
          fontSize: '40px',
          filter: 'grayscale(1)'
        }}>
          🪑
        </div>
      )}
    </div>
  );
};

const toolBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: 'none',
  borderRadius: '4px',
  color: 'rgba(255,255,255,0.7)',
  padding: '8px 0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default Workstation;
