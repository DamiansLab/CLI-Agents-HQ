import React from 'react';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  hasNotification?: boolean;
  status?: 'idle' | 'thinking' | 'offline';
}

interface WorkstationProps {
  id: number;
  agent: Agent | null;
  onClick: (agent: Agent, view?: 'profile' | 'terminal' | 'chat' | 'folder') => void;
}

const Workstation: React.FC<WorkstationProps> = ({ id, agent, onClick }) => {
  return (
    <div 
      className="desk-item"
      style={{
        padding: '10px',
        margin: '10px',
        width: '160px',
        height: '210px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#95a5a6', 
        borderRadius: '4px',
        boxShadow: '0 4px 0 #7f8c8d, 0 8px 15px rgba(0,0,0,0.3)',
        cursor: 'default',
        position: 'relative',
        border: '1px solid #bdc3c7'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '5px',
        right: '10px',
        fontSize: '12px',
        opacity: 0.6
      }}>💡</div>

      <div style={{
        fontSize: '11px',
        color: '#2c3e50',
        fontWeight: 'bold',
        marginBottom: '10px',
        backgroundColor: 'rgba(255,255,255,0.3)',
        padding: '2px 6px',
        borderRadius: '10px'
      }}>
        STATION {id + 1}
      </div>

      {agent ? (
        <>
          <div 
            onClick={() => onClick(agent, 'profile')}
            className="agent-avatar" 
            style={{ cursor: 'pointer' }}
          >
            {agent.avatar || "👨‍💼"}
          </div>
          <p 
            onClick={() => onClick(agent, 'profile')}
            style={{ 
              fontWeight: 'bold', 
              margin: '0', 
              textAlign: 'center',
              fontSize: '14px',
              color: '#2c3e50',
              wordBreak: 'break-word',
              width: '100%',
              cursor: 'pointer'
            }}
          >
            {agent.name}
          </p>
          
          {/* Work Tools Icons */}
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-around',
            width: '100%',
            padding: '5px 0',
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '4px'
          }}>
            <span 
              onClick={(e) => { e.stopPropagation(); onClick(agent, 'folder'); }}
              title="Set Directory" 
              style={{ cursor: 'pointer', fontSize: '18px' }}
            >📂</span>
            <span 
              onClick={(e) => { e.stopPropagation(); onClick(agent, 'terminal'); }}
              title="Open Terminal" 
              style={{ cursor: 'pointer', fontSize: '18px' }}
            >💻</span>
            <span 
              onClick={(e) => { e.stopPropagation(); onClick(agent, 'chat'); }}
              title="Open Chat" 
              style={{ cursor: 'pointer', fontSize: '18px', position: 'relative' }}
            >
              💬
              {agent.hasNotification && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#e74c3c',
                  borderRadius: '50%',
                  border: '2px solid #95a5a6'
                }}></span>
              )}
            </span>
          </div>

          <div style={{
            marginTop: '5px',
            width: '100%',
            height: '6px',
            backgroundColor: agent.status === 'thinking' ? '#f1c40f' : agent.status === 'idle' ? '#2ecc71' : '#34495e',
            borderRadius: '2px',
            boxShadow: agent.status === 'thinking' ? '0 0 5px #f1c40f' : 'none',
            transition: 'all 0.3s ease'
          }}></div>
        </>
      ) : (
        <div style={{ 
          marginTop: '40px',
          color: 'rgba(0,0,0,0.2)',
          fontSize: '40px'
        }}>
          🪑
        </div>
      )}
    </div>
  );
};

export default Workstation;
