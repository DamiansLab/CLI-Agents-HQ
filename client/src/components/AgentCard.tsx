import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  workingDirectory?: string;
  hasNotification?: boolean;
  status?: 'idle' | 'thinking' | 'offline';
  terminalHistory?: string[];
  skillId?: string;
}

interface Skill {
  id: string;
  name: string;
}

interface AgentCardProps {
  agent: Agent;
  location: 'workstation' | 'break';
  socket: Socket | null;
  onClose: () => void;
  onFire: (id: string) => void;
  onSendToBreak?: (id: string) => void;
  onReturnFromBreak?: (id: string) => void;
  onUpdateAgent: (id: string, updates: Partial<Agent>) => void;
  initialView?: 'profile' | 'terminal' | 'chat' | 'folder';
}

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

const AVATAR_OPTIONS = ["👨‍💼", "👩‍💼", "🧑‍💻", "👩‍💻", "🕵️", "🦸", "🥷", "🤖"];

const AgentCard: React.FC<AgentCardProps> = ({ 
  agent, 
  location, 
  socket,
  onClose, 
  onFire, 
  onSendToBreak, 
  onReturnFromBreak,
  onUpdateAgent,
  initialView = 'profile'
}) => {
  const [view, setView] = useState(initialView);
  const [name, setName] = useState(agent.name);
  const [isEditing, setIsEditing] = useState(false);
  
  // Terminal State (Using agent prop for history)
  const terminalHistory = agent.terminalHistory || [];
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  // Chat State (Using agent prop for history)
  const chatMessages = agent.chatHistory || [];
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Folder Browser State
  const [currentPath, setCurrentPath] = useState(agent.workingDirectory || "");
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [parentPath, setParentPath] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => setAvailableSkills(data))
      .catch(err => console.error('Error fetching skills:', err));
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    if (view === 'terminal' || view === 'chat') {
      socket.emit('start-terminal', { agentId: agent.id, directory: agent.workingDirectory });
    }
  }, [agent.id, view, agent.workingDirectory, socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalInput.trim() && socket) {
      socket.emit('terminal-input', { agentId: agent.id, input: terminalInput });
      setTerminalInput("");
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && socket) {
      const msg = chatInput;
      onUpdateAgent(agent.id, {
        chatHistory: [...chatMessages, {
          sender: 'user',
          text: msg,
          timestamp: new Date().toLocaleTimeString()
        }]
      });
      socket.emit('chat-message', { agentId: agent.id, message: msg, skillId: agent.skillId });
      setChatInput("");
    }
  };

  const browseFolder = async (path: string = "") => {
    const res = await fetch('/api/browse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const data = await res.json();
    setCurrentPath(data.currentPath);
    setFolders(data.folders);
    setFiles(data.files || []);
    setParentPath(data.parent);
  };

  const feedFileToAgent = async (fileName: string) => {
    const fullPath = `${currentPath}${pathSeparator}${fileName}`;
    const res = await fetch('/api/read-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: fullPath })
    });
    const data = await res.json();
    if (data.content && socket) {
      const message = `Context from file ${fileName}:\n\n${data.content}`;
      socket.emit('chat-message', { agentId: agent.id, message });
      alert(`Fed ${fileName} to agent context.`);
    }
  };

  useEffect(() => {
    if (view === 'folder') {
      browseFolder(currentPath);
    }
    // Clear notification when opening chat
    if (view === 'chat' && agent.hasNotification) {
      onUpdateAgent(agent.id, { hasNotification: false });
    }
  }, [view]);

  const selectDirectory = () => {
    onUpdateAgent(agent.id, { workingDirectory: currentPath });
    if (socket) {
      socket.emit('restart-agent', { agentId: agent.id, directory: currentPath });
    }
    setView('profile');
  };

  const clearTerminal = () => {
    if (window.confirm("Clear terminal history for this agent?")) {
      onUpdateAgent(agent.id, { terminalHistory: [] });
    }
  };

  const [isReflecting, setIsReflecting] = useState(false);
  const handleReflect = async () => {
    if (!agent.skillId) {
      alert("Assign a role first before reflecting.");
      return;
    }
    if (chatMessages.length < 2) {
      alert("Not enough conversation to learn from yet.");
      return;
    }

    setIsReflecting(true);
    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          skillId: agent.skillId,
          chatHistory: chatMessages
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Learned successfully!\n\nNew Insights:\n${data.reflection}`);
      } else {
        alert(`Reflection failed: ${data.error}`);
      }
    } catch (err) {
      alert("Error during reflection.");
    } finally {
      setIsReflecting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div className="agent-card-content" style={{
        backgroundColor: '#fff',
        borderRadius: '15px',
        width: '550px',
        maxWidth: '95%',
        height: '700px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
          <button onClick={() => setView('profile')} style={tabStyle(view === 'profile')}>Profile</button>
          <button onClick={() => setView('terminal')} style={tabStyle(view === 'terminal')}>Terminal</button>
          <button onClick={() => setView('folder')} style={tabStyle(view === 'folder')}>Directory</button>
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'none', padding: '10px 15px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '20px', flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {view === 'profile' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '60px', marginBottom: '10px' }}>{agent.avatar || "👨‍💼"}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {AVATAR_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => onUpdateAgent(agent.id, { avatar: opt })} style={avatarBtnStyle(agent.avatar === opt)}>{opt}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '25px' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input value={name} onChange={e => setName(e.target.value)} style={{ padding: '8px', flexGrow: 1 }} />
                    <button onClick={() => { onUpdateAgent(agent.id, { name }); setIsEditing(false); }}>Save</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{agent.name}</span>
                    <button onClick={() => setIsEditing(true)} style={{ fontSize: '12px' }}>Edit Name</button>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>ASSIGN ROLE / SKILL:</label>
                <select 
                  value={agent.skillId || ""} 
                  onChange={(e) => onUpdateAgent(agent.id, { skillId: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '5px', 
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">No Special Skill (Generalist)</option>
                  {availableSkills.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px', backgroundColor: '#f0f4f8', padding: '10px', borderRadius: '5px' }}>
                <strong>Status:</strong> <span style={{ color: agent.status === 'thinking' ? '#f39c12' : agent.status === 'idle' ? '#27ae60' : '#7f8c8d' }}>
                  {agent.status?.toUpperCase() || 'OFFLINE'}
                </span><br/>
                <strong>Working Directory:</strong><br/>
                <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{agent.workingDirectory || "Default project root"}</code>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {location === 'workstation' ? (
                  <button onClick={() => { onSendToBreak?.(agent.id); onClose(); }} style={btnStyle('#2196f3')}>Send to Break Room</button>
                ) : (
                  <button onClick={() => { onReturnFromBreak?.(agent.id); onClose(); }} style={btnStyle('#ff9800')}>Return to Work</button>
                )}
                <button onClick={() => { onFire(agent.id); onClose(); }} style={btnStyle('#ff5252')}>Fire Agent</button>
              </div>
            </>
          )}

          {view === 'terminal' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
                <button onClick={clearTerminal} style={{ 
                  background: '#444', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '4px 10px', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  cursor: 'pointer' 
                }}>Clear Logs</button>
              </div>
              <div style={{ 
                flexGrow: 1, 
                backgroundColor: '#1e1e1e', 
                color: '#d4d4d4', 
                padding: '10px', 
                fontFamily: 'monospace', 
                fontSize: '13px',
                borderRadius: '4px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {terminalHistory.join('')}
                {!terminalHistory.length && "Terminal initialized. Waiting for output..."}
                <div ref={terminalEndRef} />
              </div>
              <form onSubmit={handleTerminalSubmit} style={{ marginTop: '10px', display: 'flex' }}>
                <span style={{ color: '#0f0', padding: '5px' }}>&gt;</span>
                <input 
                  autoFocus
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  style={{ 
                    flexGrow: 1, 
                    backgroundColor: 'transparent', 
                    border: 'none', 
                    outline: 'none', 
                    color: '#fff',
                    fontFamily: 'monospace'
                  }}
                />
              </form>
            </div>
          )}

          {view === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button 
                  onClick={handleReflect} 
                  disabled={isReflecting || chatMessages.length < 2}
                  style={{ 
                    background: '#673ab7', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '6px 12px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    cursor: 'pointer',
                    opacity: (isReflecting || chatMessages.length < 2) ? 0.5 : 1
                  }}
                >
                  {isReflecting ? "🧠 Learning..." : "✨ End Session & Reflect"}
                </button>
              </div>
              <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '15px', padding: '5px' }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ 
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: m.sender === 'user' ? '#e1f5fe' : '#f1f1f1',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    marginBottom: '8px',
                    maxWidth: '85%',
                    marginLeft: m.sender === 'user' ? 'auto' : '0',
                    fontSize: '14px',
                    position: 'relative'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    <div style={{ fontSize: '10px', color: '#999', textAlign: 'right', marginTop: '4px' }}>{m.timestamp}</div>
                  </div>
                ))}
                {agent.status === 'thinking' && (
                  <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>{agent.name} is thinking...</div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  autoFocus
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  style={{ 
                    flexGrow: 1, 
                    padding: '10px', 
                    borderRadius: '20px', 
                    border: '1px solid #ddd',
                    outline: 'none'
                  }}
                />
                <button type="submit" style={{ ...btnStyle('#4caf50'), borderRadius: '20px', padding: '8px 20px' }}>Send</button>
              </form>
            </div>
          )}

          {view === 'folder' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                <strong>Select Working Directory / Feed Context:</strong>
                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', wordBreak: 'break-all', borderRadius: '4px', marginTop: '5px' }}>{currentPath}</div>
              </div>
              <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                <div onClick={() => browseFolder(parentPath)} style={folderStyle}>📁 .. (Up)</div>
                {folders.map(f => (
                  <div key={f} onClick={() => browseFolder(currentPath + pathSeparator + f)} style={folderStyle}>📁 {f}</div>
                ))}
                {files.map(f => (
                  <div key={f} style={{ ...folderStyle, color: '#3498db', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📄 {f}</span>
                    <button onClick={() => feedFileToAgent(f)} style={{ fontSize: '10px', padding: '2px 5px', cursor: 'pointer' }}>Feed Context</button>
                  </div>
                ))}
              </div>
              <button onClick={selectDirectory} style={{ ...btnStyle('#4caf50'), marginTop: '10px' }}>Set as Working Directory</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const pathSeparator = navigator.platform.includes('Win') ? '\\' : '/';

const tabStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '12px',
  border: 'none',
  background: active ? '#fff' : '#f8f9fa',
  borderBottom: active ? 'none' : '1px solid #ddd',
  cursor: 'pointer',
  fontWeight: active ? 'bold' : 'normal',
  color: active ? '#2c3e50' : '#888'
});

const btnStyle = (bg: string): React.CSSProperties => ({
  backgroundColor: bg,
  color: 'white',
  border: 'none',
  padding: '12px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold'
});

const avatarBtnStyle = (active: boolean): React.CSSProperties => ({
  fontSize: '24px',
  padding: '5px',
  border: active ? '2px solid #3498db' : '1px solid #eee',
  borderRadius: '8px',
  backgroundColor: active ? '#ebf5fb' : 'white',
  cursor: 'pointer'
});

const folderStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
  cursor: 'pointer',
  fontSize: '14px'
};

export default AgentCard;
