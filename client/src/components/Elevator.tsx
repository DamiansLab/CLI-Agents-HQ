import React from 'react';

interface ElevatorProps {
  currentFloor: number;
  onFloorChange: (floor: number) => void;
}

const Elevator: React.FC<ElevatorProps> = ({ currentFloor, onFloorChange }) => {
  const floors = [
    { id: 1, name: '1', label: 'Engineering' },
    { id: 2, name: '2', label: 'Staff Lounge' },
    { id: 3, name: '3', label: 'Archive' },
  ];

  return (
    <div style={{
      position: 'fixed',
      left: '30px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      background: 'linear-gradient(145deg, #1e1e2f, #151525)',
      padding: '20px 15px',
      borderRadius: '30px',
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 3000,
      boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)'
    }}>
      {/* Indicator Screen */}
      <div style={{
        background: '#000',
        borderRadius: '5px',
        padding: '10px 5px',
        marginBottom: '10px',
        border: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px'
      }}>
        <div style={{
          color: '#ff4b2b',
          fontWeight: 'bold',
          fontSize: '20px',
          fontFamily: '"Courier New", Courier, monospace',
          textShadow: '0 0 8px rgba(255, 75, 43, 0.6)',
          lineHeight: 1
        }}>
          {currentFloor}
        </div>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#ff4b2b',
          boxShadow: '0 0 5px #ff4b2b',
          animation: 'blink 1.5s infinite'
        }} />
      </div>

      {floors.map(floor => (
        <div key={floor.id} style={{ position: 'relative' }}>
          <button
            onClick={() => onFloorChange(floor.id)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '2px solid',
              borderColor: currentFloor === floor.id ? '#ff4b2b' : '#444',
              background: currentFloor === floor.id 
                ? 'radial-gradient(circle at 30% 30%, #ff6a4d, #ff4b2b)' 
                : 'linear-gradient(145deg, #2c2c3c, #1a1a2a)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: currentFloor === floor.id 
                ? '0 0 20px rgba(255, 75, 43, 0.4), inset 0 2px 2px rgba(255,255,255,0.3)' 
                : '0 5px 10px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            title={floor.label}
          >
            {floor.id}
          </button>
          
          {/* Label for floor */}
          <div style={{
            position: 'absolute',
            left: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            opacity: 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.1)'
          }} className="elevator-tooltip">
            {floor.label}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        button:hover + .elevator-tooltip {
          opacity: 1 !important;
        }
        button:active {
          transform: scale(0.9) !important;
        }
      `}</style>
    </div>
  );
};

export default Elevator;
