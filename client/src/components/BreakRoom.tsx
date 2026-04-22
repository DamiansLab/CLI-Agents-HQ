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
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: '#fff',
      minHeight: '200px',
      boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
      border: '1px solid #e0e0e0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
        <span style={{ fontSize: '24px' }}>🛋️</span>
        <h2 style={{ color: '#5d4037', margin: 0, fontSize: '20px' }}>Staff Lounge</h2>
      </div>
      
      {agents.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: '#999' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>☕</div>
          <p>No agents are currently on break.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {agents.map(agent => (
            <div 
              key={agent.id} 
              onClick={() => onClick(agent)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#fdfdfd',
                borderRadius: '50px',
                border: '1px solid #d7ccc8',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                fontWeight: '600',
                color: '#5d4037',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#efebe9';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fdfdfd';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
              }}
            >
              <span style={{ fontSize: '24px' }}>{agent.avatar || "👨‍💼"}</span>
              <span>{agent.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BreakRoom;
