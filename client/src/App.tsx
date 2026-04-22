import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import './App.css'
import Workstation from './components/Workstation'
import BreakRoom from './components/BreakRoom'
import AgentCard from './components/AgentCard'
import ChatWindow from './components/ChatWindow'

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
  const [showLogs, setShowLogs] = useState(false);
  const [showBreakRoom, setShowBreakRoom] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const updateAgent = (agentId: string, updates: Partial<Agent>) => {
    const updater = (a: Agent | null) => (a && a.id === agentId) ? { ...a, ...updates } : a;
    
    setWorkstations(prev => prev.map(updater));
    setBreakRoomAgents(prev => prev.map(a => (a.id === agentId) ? { ...a, ...updates } : a));
    
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

      updateAgent(agentId, { 
        chatHistory: undefined, // Placeholder, we'll handle actual update below
      });

      // We need a way to append to history without knowing the full history here
      // Let's modify updateAgent to support functional updates for fields
      setWorkstations(prev => prev.map(a => 
        a?.id === agentId ? { ...a, chatHistory: [...(a.chatHistory || []), newMessage] } : a
      ));
      setBreakRoomAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, chatHistory: [...(a.chatHistory || []), newMessage] } : a
      ));

      setActiveChats(prevActive => {
        if (!prevActive.includes(agentId)) {
          updateAgent(agentId, { hasNotification: true });
        }
        return prevActive;
      });
      addLog(`Agent response from ${agentId.substr(0,4)}: ${text.substr(0, 50)}...`, 'info');
    });

    socketRef.current.on('agent-status', ({ agentId, status }) => {
      updateAgent(agentId, { status });
    });

    socketRef.current.on('terminal-output', ({ agentId, data, type }) => {
      if (type === 'error') {
        addLog(`[${agentId.substr(0,4)}] ERROR: ${data}`, 'error');
      }

      setWorkstations(prev => prev.map(a => 
        a?.id === agentId ? { ...a, terminalHistory: [...(a.terminalHistory || []), data].slice(-500) } : a
      ));
      setBreakRoomAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, terminalHistory: [...(a.terminalHistory || []), data].slice(-500) } : a
      ));
    });

    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        if (data.workstations) setWorkstations(data.workstations);
        if (data.breakRoomAgents) setBreakRoomAgents(data.breakRoomAgents);
        if (data.logs) setLogs(data.logs);
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
        body: JSON.stringify({ workstations, breakRoomAgents, logs })
      });
    }
  }, [workstations, breakRoomAgents, logs, isLoaded]);

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

  const clearLogs = () => {
    setLogs([]);
  };

  const hireAgent = () => {
    const randomName = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    const newAgent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${randomName} #${Math.floor(Math.random() * 1000)}`,
      avatar: randomAvatar,
      hasNotification: false,
      status: 'offline',
      chatHistory: []
    };
    
    setWorkstations(prev => {
      const emptySlotIndex = prev.findIndex(slot => slot === null);
      if (emptySlotIndex === -1) return prev;
      const newWorkstations = [...prev];
      newWorkstations[emptySlotIndex] = newAgent;
      return newWorkstations;
    });
    addLog(`Hired new agent: ${newAgent.name}`, 'success');
  };

  const handleFire = (agentId: string) => {
    if (window.confirm(`Fire agent?`)) {
      setWorkstations(prev => prev.map(slot => (slot && slot.id === agentId) ? null : slot));
      setBreakRoomAgents(prev => prev.filter(a => a.id !== agentId));
      setActiveChats(prev => prev.filter(id => id !== agentId));
      addLog(`Agent has been terminated.`, 'error');
    }
  };

  const sendToBreak = (agentId: string) => {
    // Find the agent first
    const agent = workstations.find(a => a?.id === agentId);
    if (!agent) return;

    // Add to break room first
    setBreakRoomAgents(prev => {
      if (prev.find(a => a.id === agentId)) return prev;
      return [...prev, agent];
    });

    // Then remove from workstations
    setWorkstations(prev => prev.map(slot => slot?.id === agentId ? null : slot));
    
    addLog(`${agent.name} is on break.`, 'info');
  };

  const returnFromBreak = (agentId: string) => {
    const agent = breakRoomAgents.find(a => a.id === agentId);
    if (!agent) return;

    setWorkstations(prev => {
      const emptySlotIndex = prev.findIndex(slot => slot === null);
      if (emptySlotIndex === -1) {
        alert("No free workstations!");
        return prev;
      }
      
      // Remove from break room only if we found a workstation
      setBreakRoomAgents(prevBreak => prevBreak.filter(a => a.id !== agentId));
      
      const newWork = [...prev];
      newWork[emptySlotIndex] = agent;
      return newWork;
    });

    addLog(`${agent.name} is back to work.`, 'info');
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

  if (!isLoaded) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>INITIALIZING HQ...</div>;

  return (
    <div className="App">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: '#ecf0f1', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>CLI AGENTS HQ</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowLogs(true)} 
            style={{
              padding: '12px 24px',
              fontSize: '18px',
              backgroundColor: '#607d8b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 0 #455a64',
            }}
          >
            📟 SYSTEM LOGS
          </button>
          <button 
            onClick={() => setShowBreakRoom(true)} 
            style={{
              padding: '12px 24px',
              fontSize: '18px',
              backgroundColor: '#795548',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 0 #5d4037',
            }}
          >
            ☕ BREAK ROOM ({breakRoomAgents.length})
          </button>
          <button onClick={hireAgent} className="hire-btn">➕ HIRE NEW AGENT</button>
        </div>
      </div>

      <div className="office-grid">
        {workstations.map((agent, index) => (
          <Workstation key={index} id={index} agent={agent} onClick={openAgent} />
        ))}
      </div>

      {/* Break Room Modal */}
      {showBreakRoom && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000
        }} onClick={() => setShowBreakRoom(false)}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '15px',
            width: '800px',
            maxWidth: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ 
              padding: '15px 20px', 
              backgroundColor: '#795548', 
              color: 'white', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <h3 style={{ margin: 0 }}>☕ Agent Break Room</h3>
              <button 
                onClick={() => setShowBreakRoom(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  fontSize: '24px', 
                  cursor: 'pointer',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              padding: '30px', 
              background: '#f5f5f5'
            }}>
              <BreakRoom agents={breakRoomAgents} onClick={(a) => { openAgent(a, 'profile'); setShowBreakRoom(false); }} />
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

      {/* Global Logs Modal */}
      {showLogs && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000
        }} onClick={() => setShowLogs(false)}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '15px',
            width: '800px',
            maxWidth: '90%',
            height: '600px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ 
              padding: '15px 20px', 
              backgroundColor: '#2c3e50', 
              color: 'white', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <h3 style={{ margin: 0 }}>📟 Global System Logs</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => { setLogs([]); }}
                  style={{ 
                    padding: '5px 15px', 
                    fontSize: '12px', 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear History
                </button>
                <button 
                  onClick={() => setShowLogs(false)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'white', 
                    fontSize: '24px', 
                    cursor: 'pointer',
                    lineHeight: '1'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              backgroundColor: '#1e1e1e', 
              padding: '20px', 
              fontFamily: 'monospace',
              fontSize: '13px'
            }}>
              {logs.map(log => (
                <div key={log.id} style={{ marginBottom: '8px', color: log.type === 'error' ? '#ff5252' : log.type === 'success' ? '#4caf50' : '#d4d4d4' }}>
                  <span style={{ color: '#888', marginRight: '10px' }}>[{log.timestamp}]</span>
                  <span style={{ color: log.type === 'info' ? '#3498db' : 'inherit', fontWeight: log.type === 'error' ? 'bold' : 'normal' }}>
                    {log.type.toUpperCase()}:
                  </span> {log.message}
                </div>
              ))}
              {logs.length === 0 && <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: '100px' }}>No global events recorded.</div>}
              <div ref={logEndRef} />
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
