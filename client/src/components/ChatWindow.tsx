import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { X, Send, Trash2, RotateCcw, StopCircle, Sparkles, Maximize2, Minimize2 } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  workingDirectory?: string;
  hasNotification?: boolean;
  status?: 'idle' | 'thinking' | 'offline';
  chatHistory?: ChatMessage[];
  skillId?: string;
}

interface ChatWindowProps {
  agent: Agent;
  socket: Socket | null;
  projectBrief?: string;
  onClose: () => void;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ agent, socket, projectBrief, onClose, onUpdateAgent }) => {
  const [input, setInput] = useState("");
  const [isReflecting, setIsReflecting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = agent.chatHistory || [];

  // Clear notification on mount and whenever a new message arrives while window is open
  useEffect(() => {
    if (socket && agent.hasNotification) {
      socket.emit('read-messages', { agentId: agent.id });
      onUpdateAgent(agent.id, { hasNotification: false });
    }
  }, [agent.id, agent.hasNotification, socket]);

  const handleReflect = async () => {
    if (!agent.skillId) return alert("Assign a role first.");
    if (messages.length < 2) return alert("Not enough conversation.");

    setIsReflecting(true);
    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, skillId: agent.skillId, chatHistory: messages })
      });
      const data = await res.json();
      if (data.success) alert(`Learned successfully!\n\n${data.reflection}`);
    } catch (err) { alert("Error reflecting."); }
    finally { setIsReflecting(false); }
  };

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('start-terminal', { agentId: agent.id, directory: agent.workingDirectory });
  }, [agent.id, agent.workingDirectory, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && socket) {
      const msgText = input;
      onUpdateAgent(agent.id, {
        chatHistory: [...messages, { sender: 'user', text: msgText, timestamp: new Date().toLocaleTimeString() }]
      });
      socket.emit('chat-message', { 
        agentId: agent.id, 
        message: msgText, 
        skillId: agent.skillId,
        projectBrief,
        directory: agent.workingDirectory 
      });
      setInput("");
    }
  };

  const stopAgent = () => {
    if (socket) socket.emit('stop-agent', { agentId: agent.id });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        width: isFullScreen ? '90vw' : '320px',
        height: isFullScreen ? '85vh' : '480px',
        x: isFullScreen ? '-50%' : position.x,
        y: isFullScreen ? '-50%' : position.y,
        top: isFullScreen ? '50%' : 'auto',
        left: isFullScreen ? '50%' : 'auto',
        position: isFullScreen ? 'fixed' : 'relative'
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        ...windowStyle,
        zIndex: isFullScreen ? 5000 : (isDragging ? 3000 : 2000),
        boxShadow: isDragging ? '0 30px 60px rgba(0,0,0,0.5)' : '0 15px 35px rgba(0,0,0,0.3)',
        pointerEvents: 'auto'
      }}
      className="glass-panel"
    >
      {/* Header */}
      <div onMouseDown={isFullScreen ? undefined : handleMouseDown} style={{ ...headerStyle, cursor: isFullScreen ? 'default' : 'grab' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: isFullScreen ? '32px' : '24px' }}>{agent.avatar}</span>
          <div>
            <div style={{ fontSize: isFullScreen ? '16px' : '13px', fontWeight: 'bold', color: '#fff' }}>{agent.name}</div>
            <div style={{ fontSize: '9px', color: agent.status === 'thinking' ? '#f1c40f' : '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={statusDotStyle(agent.status)}/> {agent.status?.toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {agent.status === 'thinking' && <button onClick={stopAgent} style={headerBtnStyle} title="Stop"><StopCircle size={14} color="#e74c3c"/></button>}
          <button onClick={handleReflect} disabled={isReflecting} style={{ ...headerBtnStyle, opacity: isReflecting ? 0.5 : 1 }} title="Reflect"><Sparkles size={14}/></button>
          <button onClick={() => socket?.emit('restart-agent', { agentId: agent.id, directory: agent.workingDirectory })} style={headerBtnStyle} title="Restart"><RotateCcw size={14}/></button>
          <button onClick={() => onUpdateAgent(agent.id, { chatHistory: [] })} style={headerBtnStyle} title="Clear"><Trash2 size={14}/></button>
          <button onClick={() => setIsFullScreen(!isFullScreen)} style={headerBtnStyle} title={isFullScreen ? "Minimize" : "Maximize"}>
            {isFullScreen ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
          </button>
          <button onClick={onClose} style={{ ...headerBtnStyle, color: '#fff' }}><X size={16}/></button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ ...messagesContainerStyle, padding: isFullScreen ? '30px' : '15px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            ...bubbleStyle,
            maxWidth: isFullScreen ? '70%' : '85%',
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            background: m.sender === 'user' ? '#3498db' : 'rgba(255,255,255,0.08)',
            color: '#fff',
            borderRadius: m.sender === 'user' ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
            fontSize: isFullScreen ? '15px' : '13px'
          }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '5px', textAlign: 'right' }}>{m.timestamp}</div>
          </div>
        ))}
        {agent.status === 'thinking' && (
          <div style={{ display: 'flex', gap: '5px', padding: '10px' }}>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={dotStyle}/>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={dotStyle}/>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={dotStyle}/>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={inputFormStyle}>
        <input 
          autoFocus 
          placeholder="Message agent..." 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          style={inputStyle}
        />
        <button type="submit" style={sendBtnStyle}><Send size={16}/></button>
      </form>
    </motion.div>
  );
};

// Styles
const windowStyle: React.CSSProperties = {
  width: '320px', height: '480px', display: 'flex', flexDirection: 'column',
  borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
  position: 'relative', transition: 'box-shadow 0.2s ease'
};

const headerStyle: React.CSSProperties = {
  padding: '12px 15px', background: 'rgba(0,0,0,0.3)', display: 'flex',
  alignItems: 'center', justifyContent: 'space-between', cursor: 'grab'
};

const headerBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
  cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'all 0.2s'
};

const statusDotStyle = (status?: string): React.CSSProperties => ({
  width: '6px', height: '6px', borderRadius: '50%',
  background: status === 'thinking' ? '#f1c40f' : '#2ecc71',
  boxShadow: `0 0 8px ${status === 'thinking' ? '#f1c40f' : '#2ecc71'}`
});

const messagesContainerStyle: React.CSSProperties = {
  flexGrow: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px'
};

const bubbleStyle: React.CSSProperties = {
  padding: '10px 14px', maxWidth: '85%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'relative'
};

const dotStyle: React.CSSProperties = { width: '6px', height: '6px', background: '#3498db', borderRadius: '50%' };

const inputFormStyle: React.CSSProperties = {
  padding: '12px', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)'
};

const inputStyle: React.CSSProperties = {
  flexGrow: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', padding: '8px 15px', borderRadius: '20px', outline: 'none', fontSize: '13px'
};

const sendBtnStyle: React.CSSProperties = {
  width: '34px', height: '34px', borderRadius: '50%', background: '#3498db',
  border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
};

export default ChatWindow;
