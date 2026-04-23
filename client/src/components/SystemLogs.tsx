import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Trash2 } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface SystemLogsProps {
  logs: LogEntry[];
  onClose: () => void;
  onClearLogs: () => void;
}

const SystemLogs: React.FC<SystemLogsProps> = ({ logs, onClose, onClearLogs }) => {
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
        <div style={{ ...modalHeaderStyle, backgroundColor: '#455a64' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={20} />
            <h3 style={{ margin: 0 }}>📟 System Logs</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={onClearLogs} style={clearBtnStyle} title="Clear Logs">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} style={closeBtnStyle}>×</button>
          </div>
        </div>

        <div style={bodyStyle}>
          <div style={terminalStyle}>
            {logs.length === 0 ? (
              <div style={emptyStyle}>No system logs yet.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{ ...logEntryStyle, color: getLogColor(log.type) }}>
                  <span style={timestampStyle}>[{log.timestamp}]</span>
                  <span style={typeStyle}>{log.type.toUpperCase()}:</span>
                  <span style={messageStyle}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={footerStyle}>
          <div style={{ fontSize: '11px', opacity: 0.4, fontFamily: 'monospace' }}>
            TOTAL ENTRIES: {logs.length} | SYSTEM STATUS: ONLINE
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const getLogColor = (type: LogEntry['type']) => {
  switch (type) {
    case 'error': return '#ff5252';
    case 'warning': return '#ffd740';
    case 'success': return '#69f0ae';
    default: return '#e0e0e0';
  }
};

// Modal Styles to match App.tsx, KnowledgeVault, etc.
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#1a1c2c', borderRadius: '15px', width: '850px', maxWidth: '95%', height: '600px',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.1)'
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: '1'
};

const clearBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', 
  padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', 
  alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
};

const bodyStyle: React.CSSProperties = { 
  flexGrow: 1, 
  padding: '20px', 
  background: '#000',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const terminalStyle: React.CSSProperties = {
  flexGrow: 1,
  overflowY: 'auto',
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  fontSize: '13px',
  lineHeight: '1.5',
  padding: '10px'
};

const logEntryStyle: React.CSSProperties = {
  marginBottom: '4px',
  display: 'flex',
  gap: '10px',
  wordBreak: 'break-all'
};

const timestampStyle: React.CSSProperties = { color: '#666', minWidth: '85px' };
const typeStyle: React.CSSProperties = { minWidth: '65px', fontWeight: 'bold', opacity: 0.8 };
const messageStyle: React.CSSProperties = { flex: 1 };

const emptyStyle: React.CSSProperties = {
  color: '#444', textAlign: 'center', marginTop: '100px', fontStyle: 'italic'
};

const footerStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: 'rgba(0,0,0,0.3)',
  borderTop: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  justifyContent: 'flex-end'
};

export default SystemLogs;
