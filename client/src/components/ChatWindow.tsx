import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status?: 'idle' | 'thinking' | 'offline';
}

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface ChatWindowProps {
  agent: Agent;
  socket: Socket | null;
  onClose: () => void;
  onMinimize?: () => void;
}

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status?: 'idle' | 'thinking' | 'offline';
  chatHistory?: ChatMessage[];
}

interface ChatWindowProps {
  agent: Agent;
  socket: Socket | null;
  onClose: () => void;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ agent, socket, onClose, onUpdateAgent }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = agent.chatHistory || [];

  // Draggable State
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
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
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
    
    // Ensure terminal is started so we can chat
    socket.emit('start-terminal', { agentId: agent.id });
  }, [agent.id, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && socket) {
      const msgText = input;
      const newMessage: ChatMessage = {
        sender: 'user',
        text: msgText,
        timestamp: new Date().toLocaleTimeString()
      };
      
      onUpdateAgent(agent.id, {
        chatHistory: [...messages, newMessage]
      });

      socket.emit('chat-message', { agentId: agent.id, message: msgText });
      setInput("");
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history for this agent?")) {
      onUpdateAgent(agent.id, { chatHistory: [] });
    }
  };

  const forceRestart = () => {
    if (window.confirm("Force restart the Gemini process for this agent?")) {
      if (socket) {
        socket.emit('restart-agent', { agentId: agent.id });
      }
    }
  };

  return (
    <div className="chat-window-card" style={{
      width: '320px',
      height: '450px',
      backgroundColor: 'white',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isDragging ? '0 15px 35px rgba(0,0,0,0.4)' : '0 10px 25px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      border: '1px solid #ddd',
      position: 'relative',
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      zIndex: isDragging ? 3000 : 2000
    }}>
      {/* Header */}
      <div 
        onMouseDown={handleMouseDown}
        style={{
          padding: '12px',
          backgroundColor: '#2c3e50',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
          <span style={{ fontSize: '20px' }}>{agent.avatar || "🤖"}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{agent.name}</div>
            <div style={{ fontSize: '10px', color: agent.status === 'thinking' ? '#f1c40f' : '#2ecc71' }}>
              ● {agent.status || 'online'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={forceRestart} title="Force Restart Process" style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '5px'
          }}>🔄</button>
          <button onClick={clearChat} title="Clear Chat" style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '5px'
          }}>🗑️</button>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '5px'
          }}>×</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flexGrow: 1,
        padding: '15px',
        overflowY: 'auto',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: m.sender === 'user' ? '#3498db' : '#ecf0f1',
            color: m.sender === 'user' ? 'white' : '#2c3e50',
            padding: '8px 12px',
            borderRadius: '12px',
            maxWidth: '85%',
            fontSize: '13px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
              {m.timestamp}
            </div>
          </div>
        ))}
        {agent.status === 'thinking' && (
          <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
            {agent.name} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '12px',
        borderTop: '1px solid #eee',
        display: 'flex',
        gap: '8px'
      }}>
        <input 
          autoFocus
          placeholder="Send a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{
            flexGrow: 1,
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid #ddd',
            outline: 'none',
            fontSize: '13px'
          }}
        />
        <button type="submit" style={{
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>→</button>
      </form>
    </div>
  );
};

export default ChatWindow;
