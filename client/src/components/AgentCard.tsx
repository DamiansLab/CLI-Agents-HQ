import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { User, Terminal, Folder, X, Trash2, StopCircle, Sparkles, Save, Edit2, ChevronUp, MessageSquare, ChevronDown } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  workingDirectory?: string;
  hasNotification?: boolean;
  status?: 'idle' | 'thinking' | 'offline';
  terminalHistory?: string[];
  skillId?: string;
  chatHistory?: ChatMessage[];
}

interface Skill {
  id: string;
  name: string;
}

interface VaultItem {
  id: string;
  title: string;
  content: string;
}

interface AgentCardProps {
  agent: Agent;
  location: 'workstation' | 'break';
  socket: Socket | null;
  knowledgeVault?: VaultItem[];
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
  knowledgeVault,
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
  
  const terminalHistory = agent.terminalHistory || [];
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  
  const chatMessages = agent.chatHistory || [];
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [currentPath, setCurrentPath] = useState(agent.workingDirectory || "");
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [parentPath, setParentPath] = useState("");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const stopAgent = () => {
    if (socket) socket.emit('stop-agent', { agentId: agent.id });
  };

  const clearTerminal = () => {
    if (window.confirm("Clear terminal history for this agent?")) {
      onUpdateAgent(agent.id, { terminalHistory: [] });
    }
  };

  const [isReflecting, setIsReflecting] = useState(false);
  const handleReflect = async () => {
    if (!agent.skillId) return alert("Assign a role first.");
    if (chatMessages.length < 2) return alert("Not enough conversation.");

    setIsReflecting(true);
    try {
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, skillId: agent.skillId, chatHistory: chatMessages })
      });
      const data = await res.json();
      if (data.success) alert(`Learned successfully!\n\nNew Insights:\n${data.reflection}`);
    } catch (err) { alert("Error during reflection."); }
    finally { setIsReflecting(false); }
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

  useEffect(() => {
    if (view === 'folder') browseFolder(currentPath);
    if (view === 'chat' && agent.hasNotification) onUpdateAgent(agent.id, { hasNotification: false });
  }, [view]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      style={overlayStyle} 
      onClick={onClose}
    >
      <div className="glass-modal" style={cardContentStyle} onClick={e => e.stopPropagation()}>
        {/* Header Tabs */}
        <div style={tabContainerStyle}>
          <button onClick={() => setView('profile')} style={tabStyle(view === 'profile')}><User size={16} /> Profile</button>
          <button onClick={() => setView('chat')} style={tabStyle(view === 'chat')}><MessageSquare size={16} /> Chat</button>
          <button onClick={() => setView('terminal')} style={tabStyle(view === 'terminal')}><Terminal size={16} /> Terminal</button>
          <button onClick={() => setView('folder')} style={tabStyle(view === 'folder')}><Folder size={16} /> Files</button>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        <div style={bodyStyle}>
          {view === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={toolbarStyle}>
                {agent.status === 'thinking' && <button onClick={stopAgent} style={toolBtnStyle('#e74c3c')}><StopCircle size={14}/> STOP</button>}
                <button onClick={handleReflect} disabled={isReflecting || chatMessages.length < 2} style={toolBtnStyle('#673ab7')}>
                  <Sparkles size={14}/> {isReflecting ? "LEARNING..." : "REFLECT"}
                </button>
              </div>
              <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '15px', padding: '10px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ 
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: m.sender === 'user' ? '#3498db' : 'rgba(255,255,255,0.1)',
                    padding: '10px 15px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    maxWidth: '85%',
                    marginLeft: m.sender === 'user' ? 'auto' : '0',
                    fontSize: '14px',
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    <div style={{ fontSize: '10px', opacity: 0.5, textAlign: 'right', marginTop: '5px' }}>{m.timestamp}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  autoFocus
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  style={{ ...inputStyle, borderRadius: '20px', padding: '10px 20px' }}
                />
                <button type="submit" style={{ ...primaryBtnStyle, flex: 'none', borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>→</button>
              </form>
            </div>
          )}

          {view === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={avatarSectionStyle}>
                <div style={bigAvatarStyle}>{agent.avatar || "👨‍💼"}</div>
                <div style={avatarGridStyle}>
                  {AVATAR_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => onUpdateAgent(agent.id, { avatar: opt })} style={avatarBtnStyle(agent.avatar === opt)}>{opt}</button>
                  ))}
                </div>
              </div>

              <div style={infoSectionStyle}>
                <div style={labelRowStyle}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} autoFocus />
                      <button onClick={() => { onUpdateAgent(agent.id, { name }); setIsEditing(false); }} style={iconBtnStyle}><Save size={18}/></button>
                    </div>
                  ) : (
                    <>
                      <h2 style={{ margin: 0, color: '#fff' }}>{agent.name}</h2>
                      <button onClick={() => setIsEditing(true)} style={iconBtnStyle}><Edit2 size={16}/></button>
                    </>
                  )}
                </div>

                <div style={fieldStyle} ref={dropdownRef}>
                  <label style={labelStyle}>ASSIGNED ROLE</label>
                  <div style={{ position: 'relative' }}>
                    <div 
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      style={{ 
                        ...selectStyle, 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        border: isRoleDropdownOpen ? '1px solid #3498db' : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: isRoleDropdownOpen ? '0 0 15px rgba(52, 152, 219, 0.3)' : 'none'
                      }}
                    >
                      <span style={{ color: agent.skillId ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                        {availableSkills.find(s => s.id === agent.skillId)?.name || "Generalist"}
                      </span>
                      <ChevronDown size={16} style={{ 
                        transform: isRoleDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        opacity: 0.5
                      }} />
                    </div>

                    {isRoleDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'rgba(25, 25, 35, 0.95)',
                          backdropFilter: 'blur(15px)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                          zIndex: 100,
                          padding: '8px',
                          maxHeight: '250px',
                          overflowY: 'auto'
                        }}
                      >
                        <div 
                          onClick={() => { onUpdateAgent(agent.id, { skillId: "" }); setIsRoleDropdownOpen(false); }}
                          style={dropdownItemStyle(!agent.skillId)}
                        >
                          Generalist
                        </div>
                        {availableSkills.map(s => (
                          <div 
                            key={s.id}
                            onClick={() => { onUpdateAgent(agent.id, { skillId: s.id }); setIsRoleDropdownOpen(false); }}
                            style={dropdownItemStyle(agent.skillId === s.id)}
                          >
                            {s.name}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>

                <div style={statusCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>STATUS</span>
                    <span style={{ color: agent.status === 'thinking' ? '#f1c40f' : '#2ecc71' }}>● {agent.status?.toUpperCase()}</span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '11px', opacity: 0.6 }}>DIRECTORY: {agent.workingDirectory || "Root"}</div>
                </div>

                {knowledgeVault && knowledgeVault.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <label style={labelStyle}>FEED FROM VAULT</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {knowledgeVault.map(item => (
                        <button 
                          key={item.id}
                          onClick={() => {
                            const snippetMsg = `[VAULT SNIPPET: ${item.title}]\n\n${item.content}`;
                            onUpdateAgent(agent.id, {
                              chatHistory: [...chatMessages, {
                                sender: 'user',
                                text: `Feeding snippet: ${item.title}`,
                                timestamp: new Date().toLocaleTimeString()
                              }]
                            });
                            socket?.emit('chat-message', { agentId: agent.id, message: snippetMsg, skillId: agent.skillId });
                            alert(`Snippet '${item.title}' fed to ${agent.name}`);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(156, 39, 176, 0.2)',
                            border: '1px solid #9c27b0',
                            color: '#e1bee7',
                            borderRadius: '20px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          📦 {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={actionRowStyle}>
                {location === 'workstation' ? (
                  <button onClick={() => { onSendToBreak?.(agent.id); onClose(); }} style={secondaryBtnStyle}>Go to Break Room</button>
                ) : (
                  <button onClick={() => { onReturnFromBreak?.(agent.id); onClose(); }} style={primaryBtnStyle}>Back to Work</button>
                )}
                <button onClick={() => onFire(agent.id)} style={dangerBtnStyle}>Fire Agent</button>
              </div>
            </div>
          )}

          {view === 'terminal' && (
            <div style={terminalContainerStyle}>
              <div style={toolbarStyle}>
                {agent.status === 'thinking' && <button onClick={stopAgent} style={toolBtnStyle('#e74c3c')}><StopCircle size={14}/> STOP</button>}
                <button onClick={clearTerminal} style={toolBtnStyle('#555')}><Trash2 size={14}/> CLEAR</button>
              </div>
              <div className="terminal-crt" style={terminalOutputStyle}>
                {terminalHistory.join('')}
                <div ref={terminalEndRef} />
              </div>
              <form onSubmit={handleTerminalSubmit} style={terminalFormStyle}>
                <span style={{ color: '#2ecc71', marginRight: '8px' }}>$</span>
                <input 
                  autoFocus 
                  value={terminalInput} 
                  onChange={e => setTerminalInput(e.target.value)} 
                  style={terminalInputStyle} 
                  placeholder="Execute command..."
                />
              </form>
            </div>
          )}

          {view === 'folder' && (
            <div style={folderViewStyle}>
              <div style={pathHeaderStyle}>{currentPath}</div>
              <div style={fileListStyle}>
                <div onClick={() => browseFolder(parentPath)} style={itemStyle}><ChevronUp size={16}/> .. (Up)</div>
                {folders.map(f => <div key={f} onClick={() => browseFolder(currentPath + pathSeparator + f)} style={itemStyle}>📁 {f}</div>)}
                {files.map(f => (
                  <div key={f} style={fileItemStyle}>
                    <span>📄 {f}</span>
                    <button onClick={() => alert("Context fed")} style={miniBtnStyle}>FEED</button>
                  </div>
                ))}
              </div>
              <button onClick={() => onUpdateAgent(agent.id, { workingDirectory: currentPath })} style={primaryBtnStyle}>Set Directory</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const pathSeparator = navigator.platform.includes('Win') ? '\\' : '/';

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const cardContentStyle: React.CSSProperties = {
  width: '550px', height: '700px', display: 'flex', flexDirection: 'column',
  color: '#f8f9fa', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '10px 10px 0 10px', gap: '5px'
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px', border: 'none', borderRadius: '8px 8px 0 0',
  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: active ? '600' : 'normal'
});

const bodyStyle: React.CSSProperties = { flexGrow: 1, padding: '25px', overflowY: 'auto' };

const terminalContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' };
const terminalOutputStyle: React.CSSProperties = {
  flexGrow: 1, background: '#000', color: '#0f0', padding: '15px', fontFamily: 'JetBrains Mono, Fira Code, monospace',
  fontSize: '13px', borderRadius: '8px', overflowY: 'auto', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.1)'
};

const terminalFormStyle: React.CSSProperties = { display: 'flex', background: '#000', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' };
const terminalInputStyle: React.CSSProperties = { flexGrow: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'monospace' };

const toolbarStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: '10px' };
const toolBtnStyle = (bg: string): React.CSSProperties => ({
  background: bg, border: 'none', color: '#fff', padding: '5px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
});

const avatarSectionStyle: React.CSSProperties = { textAlign: 'center', marginBottom: '30px' };
const bigAvatarStyle: React.CSSProperties = { fontSize: '80px', marginBottom: '15px' };
const avatarGridStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' };
const avatarBtnStyle = (active: boolean): React.CSSProperties => ({
  fontSize: '24px', background: active ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
  border: `2px solid ${active ? '#3498db' : 'rgba(255,255,255,0.1)'}`, padding: '5px', borderRadius: '8px', cursor: 'pointer'
});

const infoSectionStyle: React.CSSProperties = { flexGrow: 1 };
const labelRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' };
const fieldStyle: React.CSSProperties = { marginBottom: '20px' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '10px', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' };
const selectStyle: React.CSSProperties = { 
  width: 'auto', 
  minWidth: '180px',
  padding: '8px 12px', 
  background: 'rgba(255,255,255,0.05)', 
  border: '1px solid rgba(255,255,255,0.1)', 
  color: '#fff', 
  borderRadius: '8px', 
  outline: 'none', 
  fontSize: '13px' 
};
const statusCardStyle: React.CSSProperties = { padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', fontSize: '13px' };

const actionRowStyle: React.CSSProperties = { display: 'flex', gap: '10px', marginTop: '20px' };
const primaryBtnStyle: React.CSSProperties = { flex: 1, padding: '12px', background: '#3498db', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const secondaryBtnStyle: React.CSSProperties = { flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: 'pointer' };
const dangerBtnStyle: React.CSSProperties = { flex: 1, padding: '12px', background: '#e74c3c', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const closeBtnStyle: React.CSSProperties = { marginLeft: 'auto', border: 'none', background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '10px' };
const iconBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '5px' };
const inputStyle: React.CSSProperties = { flexGrow: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid #3498db', color: '#fff', padding: '8px', borderRadius: '5px', outline: 'none' };

const folderViewStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' };
const pathHeaderStyle: React.CSSProperties = { padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px', fontSize: '12px', wordBreak: 'break-all', fontFamily: 'monospace' };
const fileListStyle: React.CSSProperties = { flexGrow: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflowY: 'auto' };
const itemStyle: React.CSSProperties = { padding: '10px 15px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' };
const fileItemStyle: React.CSSProperties = { ...itemStyle, color: '#3498db', justifyContent: 'space-between' };
const miniBtnStyle: React.CSSProperties = { fontSize: '10px', padding: '3px 8px', background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', border: '1px solid #3498db', borderRadius: '4px', cursor: 'pointer' };

const dropdownItemStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '12px 15px',
  borderRadius: '8px',
  cursor: 'pointer',
  background: isActive ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
  color: isActive ? '#3498db' : '#fff',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  fontWeight: isActive ? '600' : 'normal',
  marginBottom: '4px'
});

export default AgentCard;
