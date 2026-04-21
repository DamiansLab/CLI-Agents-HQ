import React from 'react';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
}

interface BreakRoomProps {
  agents: Agent[];
  onClick: (agent: Agent) => void;
}

const BreakRoom: React.FC<BreakRoomProps> = ({ agents, onClick }) => {
  return (
    <div style={{
      border: '3px dashed #4caf50',
      padding: '20px',
      marginTop: '30px',
      borderRadius: '12px',
      backgroundColor: '#f1f8e9',
      minHeight: '100px'
    }}>
      <h2 style={{ color: '#2e7d32', marginTop: 0 }}>Break Room</h2>
      {agents.length === 0 ? (
        <p>It's quiet here...</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {agents.map(agent => (
            <div 
              key={agent.id} 
              onClick={() => onClick(agent)}
              style={{
                padding: '10px 15px',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #4caf50',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8f5e9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
            >
              <span>{agent.avatar || "👨‍💼"}</span>
              <span>{agent.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BreakRoom;
