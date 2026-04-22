import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import './App.css'
import Workstation from './components/Workstation'
import BreakRoom from './components/BreakRoom'
import AgentCard from './components/AgentCard'
import ChatWindow from './components/ChatWindow'
import KnowledgeVault from './components/KnowledgeVault'
import SystemLogs from './components/SystemLogs'

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
  terminalHistory?: string[];
  skillId?: string;
  xp?: number;
  level?: number;
}

interface VaultItem {
  id: string;
  title: string;
  content: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const AGENT_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Ethan", 
  "Fiona", "George", "Hannah", "Ian", "Julia",
  "Kevin", "Laura", "Mike", "Nina", "Oscar"
];

const AVATARS = ["👨‍💼", "👩‍💼", "🧑‍💻", "👩‍💻", "🕵️", "🦸", "🥷", "🤖"];

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#fff', borderRadius: '15px', width: '600px', maxWidth: '90%', height: '500px',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: '1'
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '12px', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
};

const navBtnStyle: React.CSSProperties = {
  padding: '8px 15px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.7)',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s'
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '24px',
  background: 'rgba(255,255,255,0.1)',
  margin: '0 10px'
};

function App() {
  const [workstations, setWorkstations] = useState<(Agent | null)[]>(new Array(10).fill(null));
  const [breakRoomAgents, setBreakRoomAgents] = useState<Agent[]>([]);
  const [activeChats, setActiveChats] = useState<string[]>([]); // agent IDs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<{
    agent: Agent, 
    location: 'workstation' | 'break',
    view: 'profile' | 'terminal' | 'chat' | 'folder'
  } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [showNoticeBoard, setShowNoticeBoard] = useState(false);
  const [showKnowledgeVault, setShowKnowledgeVault] = useState(false);
  const [showStaffLounge, setShowStaffLounge] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [collabAgents, setCollabAgents] = useState<string[]>([]);
  const [collabInput, setCollabInput] = useState("");
  const [globalContext, setGlobalContext] = useState("");
  const [knowledgeVault, setKnowledgeVault] = useState<VaultItem[]>([]);
  const [groupChatHistory, setGroupChatHistory] = useState<ChatMessage[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Use refs to keep track of latest state for socket listeners
  const workstationsRef = useRef(workstations);
  const breakRoomAgentsRef = useRef(breakRoomAgents);

  useEffect(() => { workstationsRef.current = workstations; }, [workstations]);
  useEffect(() => { breakRoomAgentsRef.current = breakRoomAgents; }, [breakRoomAgents]);

  const updateAgent = (agentId: string, updates: Partial<Agent>) => {
    const updater = (a: Agent | null) => {
      if (a && a.id === agentId) {
        if (updates.skillId !== undefined && updates.skillId !== a.skillId) {
          addLog(`${a.name} role changed to: ${updates.skillId || 'Generalist'}.`, 'info');
        }
        if (updates.workingDirectory !== undefined && updates.workingDirectory !== a.workingDirectory) {
          addLog(`${a.name} is now working in: ${updates.workingDirectory}`, 'info');
        }
        return { ...a, ...updates };
      }
      return a;
    };
    
    setWorkstations(prev => prev.map(updater));
    setBreakRoomAgents(prev => prev.map(a => updater(a) as Agent));
    
    setSelectedAgent(prev => {
      if (prev && prev.agent.id === agentId) {
        return { ...prev, agent: { ...prev.agent, ...updates } };
      }
      return prev;
    });
  };

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on('agent-response', ({ agentId, text }) => {
      const newMessage: ChatMessage = {
        sender: 'agent',
        text,
        timestamp: new Date().toLocaleTimeString()
      };

      const agent = [...workstationsRef.current, ...breakRoomAgentsRef.current].find(a => a?.id === agentId);
      const agentName = agent?.name || `Agent ${agentId.substr(0,4)}`;

      // If it's a group response (simulated by looking for group context markers)
      if (text.includes("CONFERENCE MODE")) {
        setGroupChatHistory(prev => [...prev, {
          ...newMessage,
          text: `[${agentName}]: ${text.split('Collaborate and build upon their ideas.')[1] || text}`
        }]);
      }

      // Update the agent's chat history and notification status
      const updater = (a: Agent | null) => {
        if (a && a.id === agentId) {
          const isCurrentlyActive = activeChats.includes(agentId);
          return { 
            ...a, 
            chatHistory: [...(a.chatHistory || []), newMessage],
            hasNotification: !isCurrentlyActive
          };
        }
        return a;
      };

      setWorkstations(prev => prev.map(updater));
      setBreakRoomAgents(prev => prev.map(a => updater(a) as Agent));
      
      setSelectedAgent(prev => {
        if (prev && prev.agent.id === agentId) {
          return { ...prev, agent: updater(prev.agent) as Agent };
        }
        return prev;
      });

      addLog(`Response from ${agentName}: ${text.substr(0, 50)}...`, 'info');
    });

    socketRef.current.on('agent-status', ({ agentId, status }) => {
      updateAgent(agentId, { status });
      const agent = [...workstationsRef.current, ...breakRoomAgentsRef.current].find(a => a?.id === agentId);
      const agentName = agent?.name || `Agent ${agentId.substr(0,4)}`;

      if (status === 'thinking') {
        addLog(`${agentName} started thinking...`, 'info');
      }
    });

    socketRef.current.on('system-message', ({ message, type }) => {
      addLog(message, type || 'info');
    });

    socketRef.current.on('terminal-output', ({ agentId, data, type }) => {
      if (type === 'error') {
        const agent = [...workstationsRef.current, ...breakRoomAgentsRef.current].find(a => a?.id === agentId);
        const agentName = agent?.name || `Agent ${agentId.substr(0,4)}`;
        addLog(`[${agentName}] ERROR: ${data}`, 'error');
      }

      const updater = (a: Agent | null) => {
        if (a && a.id === agentId) {
          return { 
            ...a, 
            terminalHistory: [...(a.terminalHistory || []), data].slice(-500) 
          };
        }
        return a;
      };

      setWorkstations(prev => prev.map(updater));
      setBreakRoomAgents(prev => prev.map(a => updater(a) as Agent));
      
      setSelectedAgent(prev => {
        if (prev && prev.agent.id === agentId) {
          return { ...prev, agent: updater(prev.agent) as Agent };
        }
        return prev;
      });
    });

    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        if (data.workstations) setWorkstations(data.workstations);
        if (data.breakRoomAgents) setBreakRoomAgents(data.breakRoomAgents);
        if (data.logs) setLogs(data.logs);
        if (data.globalContext) setGlobalContext(data.globalContext);
        if (data.knowledgeVault) setKnowledgeVault(data.knowledgeVault);
        setIsLoaded(true);
      })
      .catch(error => {
        console.error('Error loading state:', error);
        setIsLoaded(true);
      });

    return () => {
      socketRef.current?.off('agent-response');
      socketRef.current?.off('agent-status');
      socketRef.current?.off('terminal-output');
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workstations, breakRoomAgents, logs, globalContext, knowledgeVault })
      });
    }
  }, [workstations, breakRoomAgents, logs, globalContext, knowledgeVault, isLoaded]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const hireAgent = () => {
    const randomName = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const newAgent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${randomName} #${Math.floor(Math.random() * 1000)}`,
      avatar: randomAvatar,
      hasNotification: false,
      status: 'idle',
      chatHistory: [],
      xp: 0,
      level: 1
    };
    
    setWorkstations(prev => {
      const emptySlotIndex = prev.findIndex(slot => slot === null);
      if (emptySlotIndex === -1) {
        addLog("HQ capacity reached! No free workstations.", "error");
        return prev;
      }
      const newWorkstations = [...prev];
      newWorkstations[emptySlotIndex] = newAgent;
      addLog(`Hired ${newAgent.name} at Station ${emptySlotIndex + 1}.`, 'success');
      return newWorkstations;
    });
  };

  const handleFire = (agentId: string) => {
    const agent = [...workstations, ...breakRoomAgents].find(a => a?.id === agentId);
    if (window.confirm(`Are you sure you want to fire ${agent?.name}?`)) {
      setWorkstations(prev => prev.map(slot => (slot && slot.id === agentId) ? null : slot));
      setBreakRoomAgents(prev => prev.filter(a => a.id !== agentId));
      setActiveChats(prev => prev.filter(id => id !== agentId));
      setSelectedAgent(null); // Automatically close the card
      addLog(`${agent?.name} was terminated from the team.`, 'warning');
    }
  };

  const sendToBreak = (agentId: string) => {
    const agent = workstations.find(a => a?.id === agentId);
    if (!agent) return;
    setBreakRoomAgents(prev => [...prev, agent]);
    setWorkstations(prev => prev.map(slot => slot?.id === agentId ? null : slot));
    addLog(`${agent.name} is heading to the Staff Lounge for a break.`, 'info');
  };

  const returnFromBreak = (agentId: string) => {
    const agent = breakRoomAgents.find(a => a.id === agentId);
    if (!agent) return;
    setWorkstations(prev => {
      const emptySlotIndex = prev.findIndex(slot => slot === null);
      if (emptySlotIndex === -1) {
        addLog(`No desk available for ${agent.name}.`, 'error');
        alert("No free workstations!");
        return prev;
      }
      setBreakRoomAgents(prevBreak => prevBreak.filter(a => a.id !== agentId));
      const newWork = [...prev];
      newWork[emptySlotIndex] = agent;
      addLog(`${agent.name} returned to work at Station ${emptySlotIndex + 1}.`, 'success');
      return newWork;
    });
  };

  const openAgent = (agent: Agent, view: 'profile' | 'terminal' | 'chat' | 'folder' = 'profile') => {
    console.log(`[DEBUG] openAgent called for ${agent.name} with view: ${view}`);
    
    if (view === 'chat') {
      console.log(`[DEBUG] Opening Autonomous Chat...`);
      setSelectedAgent(null); 
      setActiveChats(prev => {
        if (!prev.includes(agent.id)) {
          return [...prev, agent.id];
        }
        return prev;
      });
      updateAgent(agent.id, { hasNotification: false });
      return;
    }

    console.log(`[DEBUG] Opening Full Card: ${view}`);
    setWorkstations(prev => {
      const found = prev.find(a => a?.id === agent.id);
      const location = found ? 'workstation' : 'break';
      setSelectedAgent({ agent, location, view });
      return prev;
    });
  };

  const closeChat = (agentId: string) => {
    setActiveChats(prev => prev.filter(id => id !== agentId));
  };

  const isNight = new Date().getHours() >= 19 || new Date().getHours() <= 7;

  if (!isLoaded) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>INITIALIZING HQ...</div>;

  return (
    <div className={`App ${isNight ? 'night-mode' : ''}`}>
      {/* Sleek Command Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ 
            color: '#fff', 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '900', 
            letterSpacing: '-1px',
            background: 'linear-gradient(to right, #fff, #666)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>AGENTS_HQ</h1>
          
          <div style={dividerStyle} />

          {/* Group 1: Project Tools */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setShowNoticeBoard(true)} style={navBtnStyle} title="Project Brief"><span style={{opacity: 0.7}}>📋</span> BRIEF</button>
            <button onClick={() => setShowKnowledgeVault(!showKnowledgeVault)} style={{ ...navBtnStyle, background: showKnowledgeVault ? 'rgba(225, 190, 231, 0.2)' : navBtnStyle.background }} title="Knowledge Vault"><span style={{opacity: 0.7}}>🗄️</span> VAULT</button>
          </div>
        </div>

        {/* Group 2: Team & Operations */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowCollaboration(true)} style={{ ...navBtnStyle, background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
            🤝 CONFERENCE
          </button>
          
          <button onClick={() => setShowStaffLounge(!showStaffLounge)} style={{ ...navBtnStyle, background: showStaffLounge ? 'rgba(121, 85, 72, 0.2)' : navBtnStyle.background }}>
            ☕ LOUNGE ({breakRoomAgents.length})
          </button>

          <button onClick={hireAgent} style={{
            padding: '8px 16px',
            fontSize: '13px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
          }}>
            ➕ HIRE AGENT
          </button>

          <div style={dividerStyle} />

          <button 
            onClick={() => setShowSystemLogs(!showSystemLogs)} 
            style={{ ...navBtnStyle, width: '40px', padding: '8px 0', justifyContent: 'center', background: showSystemLogs ? 'rgba(255,255,255,0.15)' : navBtnStyle.background }} 
            title="System Logs"
          >
            📟
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        {currentFloor === 1 && (
          <div className="office-grid">
            {workstations.map((agent, index) => (
              <Workstation key={index} id={index} agent={agent} onClick={openAgent} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Knowledge Vault */}
      {showKnowledgeVault && (
        <KnowledgeVault 
          items={knowledgeVault} 
          onClose={() => setShowKnowledgeVault(false)} 
          onUpdateVault={setKnowledgeVault}
        />
      )}

      {/* Staff Lounge Modal */}
      {showStaffLounge && (
        <BreakRoom 
          agents={breakRoomAgents} 
          onClose={() => setShowStaffLounge(false)} 
          onReturnAgent={(a) => { returnFromBreak(a.id); setShowStaffLounge(false); }} 
        />
      )}

      {/* System Logs Modal */}
      {showSystemLogs && (
        <SystemLogs 
          logs={logs} 
          onClose={() => setShowSystemLogs(false)} 
          onClearLogs={() => setLogs([])}
        />
      )}

      {/* Group Collaboration Modal */}
      {showCollaboration && (
        <div className="glass-modal" style={modalOverlayStyle} onClick={() => setShowCollaboration(false)}>
          <div style={{ ...modalContentStyle, width: '800px', height: '600px' }} onClick={e => e.stopPropagation()}>
            <div style={{ ...modalHeaderStyle, backgroundColor: '#2ecc71' }}>
              <h3 style={{ margin: 0 }}>🤝 Team Collaboration</h3>
              <button onClick={() => setShowCollaboration(false)} style={closeBtnStyle}>×</button>
            </div>
            <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '10px' }}>INVITE SPECIALISTS:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {workstations.filter(a => a !== null).map(a => (
                    <div 
                      key={a!.id}
                      onClick={() => {
                        if (collabAgents.includes(a!.id)) setCollabAgents(collabAgents.filter(id => id !== a!.id));
                        else setCollabAgents([...collabAgents, a!.id]);
                      }}
                      style={{
                        padding: '8px 15px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        background: collabAgents.includes(a!.id) ? '#2ecc71' : '#f0f0f0',
                        color: collabAgents.includes(a!.id) ? '#fff' : '#666',
                        border: '1px solid #ddd'
                      }}
                    >
                      {a!.avatar} {a!.name}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ 
                flexGrow: 1, 
                background: '#0a0b14', 
                borderRadius: '12px', 
                padding: '20px', 
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {groupChatHistory.map((m, i) => (
                  <div key={i} style={{
                    padding: '12px 16px',
                    borderRadius: m.sender === 'user' ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                    backgroundColor: m.sender === 'user' ? '#3498db' : 'rgba(255,255,255,0.05)',
                    alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    color: '#fff',
                    fontSize: '13px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    <div style={{ fontSize: '9px', opacity: 0.5, textAlign: 'right', marginTop: '5px' }}>{m.timestamp}</div>
                  </div>
                ))}
                {groupChatHistory.length === 0 && (
                  <p style={{ color: '#444', textAlign: 'center', fontSize: '14px', marginTop: '100px' }}>
                    Select agents and type a message to start the collaborative discussion.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  value={collabInput}
                  onChange={e => setCollabInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (collabAgents.length === 0) return alert("Invite at least one agent!");
                      setGroupChatHistory(prev => [...prev, { sender: 'user', text: collabInput, timestamp: new Date().toLocaleTimeString() }]);
                      socketRef.current?.emit('group-chat-message', { agentIds: collabAgents, message: collabInput, projectBrief: globalContext });
                      setCollabInput("");
                    }
                  }}
                  placeholder="Ask the team a question..."
                  style={{ 
                    flexGrow: 1, 
                    padding: '12px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '30px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={() => {
                    if (collabAgents.length === 0) return alert("Invite at least one agent!");
                    setGroupChatHistory(prev => [...prev, { sender: 'user', text: collabInput, timestamp: new Date().toLocaleTimeString() }]);
                    socketRef.current?.emit('group-chat-message', {
                      agentIds: collabAgents,
                      message: collabInput,
                      projectBrief: globalContext
                    });
                    setCollabInput("");
                  }}
                  style={{ ...primaryBtnStyle, backgroundColor: '#2ecc71', padding: '10px 25px', borderRadius: '30px' }}
                >
                  Send to Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Windows */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'row-reverse',
        gap: '20px',
        zIndex: 2000,
        pointerEvents: 'none'
      }}>
        {activeChats.map(agentId => {
          const agent = workstations.find(a => a?.id === agentId) || breakRoomAgents.find(a => a.id === agentId);
          if (!agent) return null;
          return (
            <div key={agentId} style={{ pointerEvents: 'auto' }}>
              <ChatWindow 
                agent={agent} 
                socket={socketRef.current} 
                onClose={() => closeChat(agentId)} 
                onUpdateAgent={updateAgent}
              />
            </div>
          );
        })}
      </div>

      {/* Notice Board Modal */}
      {showNoticeBoard && (
        <div className="glass-modal" style={modalOverlayStyle} onClick={() => setShowNoticeBoard(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ ...modalHeaderStyle, backgroundColor: '#3f51b5' }}>
              <h3 style={{ margin: 0 }}>📋 Global Project Brief</h3>
              <button onClick={() => setShowNoticeBoard(false)} style={closeBtnStyle}>×</button>
            </div>
            <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '15px' }}>
                This brief is automatically sent to every agent you chat with. Use it to define project rules, tech stack, and goals.
              </p>
              <textarea 
                value={globalContext}
                onChange={(e) => setGlobalContext(e.target.value)}
                placeholder="e.g. We are building a React application using Tailwind CSS. All backend logic should be in Python/FastAPI. The database is PostgreSQL..."
                style={{
                  flexGrow: 1,
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#fff',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button 
                onClick={() => setShowNoticeBoard(false)}
                style={{ ...primaryBtnStyle, marginTop: '15px', backgroundColor: '#3f51b5' }}
              >
                Save Brief
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAgent && (
        <AgentCard 
          agent={selectedAgent.agent}
          location={selectedAgent.location}
          initialView={selectedAgent.view}
          socket={socketRef.current}
          knowledgeVault={knowledgeVault}
          onClose={() => setSelectedAgent(null)}
          onFire={handleFire}
          onSendToBreak={sendToBreak}
          onReturnFromBreak={returnFromBreak}
          onUpdateAgent={updateAgent}
        />
      )}
    </div>
  )
}

export default App
