import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Database, Plus, Trash2, ChevronRight } from 'lucide-react';

interface VaultItem {
  id: string;
  title: string;
  content: string;
}

interface KnowledgeVaultProps {
  items: VaultItem[];
  onClose: () => void;
  onUpdateVault: (items: VaultItem[]) => void;
}

const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({ items, onClose, onUpdateVault }) => {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", content: "" });

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) || 
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = () => {
    if (!newItem.title || !newItem.content) return;
    const item: VaultItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newItem.title,
      content: newItem.content
    };
    onUpdateVault([...items, item]);
    setNewItem({ title: "", content: "" });
    setIsAdding(false);
  };

  const deleteItem = (id: string) => {
    if (window.confirm("Remove this knowledge from the vault?")) {
      onUpdateVault(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    }
  };

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
        <div style={{ ...modalHeaderStyle, backgroundColor: '#673ab7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} />
            <h3 style={{ margin: 0 }}>🗄️ Knowledge Vault</h3>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <div style={bodyContainerStyle}>
          {/* Sidebar */}
          <div style={sidebarStyle}>
            <div style={searchBoxStyle}>
              <Search size={14} style={{ opacity: 0.5 }} />
              <input 
                placeholder="Search..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={searchInputStyle}
              />
            </div>

            <div style={listStyle}>
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => { setSelectedItem(item); setIsAdding(false); }}
                  style={itemStyle(selectedItem?.id === item.id)}
                >
                  <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.title}</div>
                    <div style={{ fontSize: '10px', opacity: 0.5, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.content.substr(0, 30)}...</div>
                  </div>
                  <ChevronRight size={14} style={{ opacity: 0.3 }} />
                </div>
              ))}
            </div>

            <button onClick={() => { setIsAdding(true); setSelectedItem(null); }} style={addButtonStyle}>
              <Plus size={14} /> NEW ENTRY
            </button>
          </div>

          {/* Content Area */}
          <div style={contentAreaStyle}>
            {isAdding ? (
              <div style={editFormStyle}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#e1bee7' }}>Add New Knowledge</h3>
                <input 
                  placeholder="Title..." 
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  style={fieldStyle}
                />
                <textarea 
                  placeholder="Content..." 
                  value={newItem.content}
                  onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                  style={{ ...fieldStyle, height: '240px', resize: 'none' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={addItem} style={saveButtonStyle}>SAVE ENTRY</button>
                  <button onClick={() => setIsAdding(false)} style={cancelButtonStyle}>CANCEL</button>
                </div>
              </div>
            ) : selectedItem ? (
              <div style={displayStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>{selectedItem.title}</h2>
                  <button onClick={() => deleteItem(selectedItem.id)} style={deleteButtonStyle}><Trash2 size={16}/></button>
                </div>
                <div style={contentTextStyle}>{selectedItem.content}</div>
              </div>
            ) : (
              <div style={emptyStyle}>
                <Database size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                <p style={{ opacity: 0.5, fontSize: '13px' }}>Select an entry or create a new one to populate your collective intelligence.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Modal Styles to match App.tsx
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#1a1c2c', borderRadius: '15px', width: '800px', maxWidth: '95%', height: '600px',
  display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.1)'
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', lineHeight: '1'
};

const bodyContainerStyle: React.CSSProperties = { display: 'flex', flexGrow: 1, overflow: 'hidden' };

const sidebarStyle: React.CSSProperties = {
  width: '240px', background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.05)',
  display: 'flex', flexDirection: 'column', padding: '15px'
};

const searchBoxStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)',
  padding: '8px 12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.1)'
};

const searchInputStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#fff', fontSize: '12px', outline: 'none', width: '100%'
};

const listStyle: React.CSSProperties = { flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' };

const itemStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
  background: active ? 'rgba(103, 58, 183, 0.2)' : 'transparent',
  border: `1px solid ${active ? 'rgba(103, 58, 183, 0.4)' : 'transparent'}`,
  transition: 'all 0.2s'
});

const addButtonStyle: React.CSSProperties = {
  marginTop: '15px', padding: '10px', background: '#673ab7', color: '#fff', border: 'none',
  borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', gap: '8px'
};

const contentAreaStyle: React.CSSProperties = { flexGrow: 1, padding: '30px', overflowY: 'auto', background: 'rgba(0,0,0,0.1)' };

const emptyStyle: React.CSSProperties = {
  height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  textAlign: 'center', padding: '0 40px'
};

const editFormStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };

const fieldStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', outline: 'none'
};

const saveButtonStyle: React.CSSProperties = {
  padding: '10px 20px', background: '#2ecc71', color: '#fff', border: 'none',
  borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
  borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
};

const displayStyle: React.CSSProperties = { height: '100%', display: 'flex', flexDirection: 'column' };

const contentTextStyle: React.CSSProperties = {
  fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap'
};

const deleteButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '5px', opacity: 0.6
};

export default KnowledgeVault;
