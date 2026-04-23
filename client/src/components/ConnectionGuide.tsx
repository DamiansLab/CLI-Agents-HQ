import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Key, Globe, Copy, Check, X, Cpu } from 'lucide-react';

interface ConnectionGuideProps {
  token: string;
  onClose: () => void;
}

const ConnectionGuide: React.FC<ConnectionGuideProps> = ({ token, onClose }) => {
  const [config, setConfig] = useState({ url: '', secret: '' });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/worker-config', { headers: { 'Authorization': token } })
      .then(res => res.json())
      .then(data => {
        // Force HTTPS in the suggestion if not on localhost
        let displayUrl = data.url;
        if (displayUrl && !displayUrl.includes('localhost') && displayUrl.startsWith('http:')) {
          displayUrl = displayUrl.replace('http:', 'https:');
        }
        setConfig({ ...data, url: displayUrl });
      })
      .catch(err => console.error("Failed to fetch config", err));
  }, [token]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="glass-modal" style={overlayStyle} onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={modalStyle}
        onClick={e => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={20} color="#3498db" />
            <h3 style={{ margin: 0 }}>Local Machine Connection</h3>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        <div style={contentStyle}>
          <p style={introText}>Follow these steps to link your local computer's terminal to this Dashboard HQ.</p>

          <div style={stepContainer}>
            <div style={stepNumber}>1</div>
            <div style={stepContent}>
              <div style={stepTitle}>Launch the Engine</div>
              <p style={stepDesc}>Open a terminal in your project folder and run:</p>
              <div style={codeBlock}>
                <code>node agent.js</code>
              </div>
            </div>
          </div>

          <div style={stepContainer}>
            <div style={stepNumber}>2</div>
            <div style={stepContent}>
              <div style={stepTitle}>Enter HQ Credentials</div>
              <p style={stepDesc}>The script will prompt you for the following details:</p>
              
              <div style={fieldGroup}>
                <div style={fieldLabel}><Globe size={12} /> DASHBOARD URL</div>
                <div style={fieldRow}>
                  <div style={fieldValue}>{config.url || 'Loading...'}</div>
                  <button onClick={() => copyToClipboard(config.url, 'url')} style={copyBtn}>
                    {copiedField === 'url' ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div style={fieldGroup}>
                <div style={fieldLabel}><Key size={12} /> SHARED SECRET KEY</div>
                <div style={fieldRow}>
                  <div style={fieldValue}>{config.secret || 'Loading...'}</div>
                  <button onClick={() => copyToClipboard(config.secret, 'secret')} style={copyBtn}>
                    {copiedField === 'secret' ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={successAlert}>
            <Terminal size={16} />
            Once connected, your local terminal will show "Verified Local Agent connected."
          </div>
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={doneBtn}>GOT IT</button>
        </div>
      </motion.div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 7000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalStyle: React.CSSProperties = { width: '450px', background: '#141625', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' };
const headerStyle: React.CSSProperties = { padding: '20px 25px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' };
const contentStyle: React.CSSProperties = { padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' };
const introText: React.CSSProperties = { margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' };

const stepContainer: React.CSSProperties = { display: 'flex', gap: '15px' };
const stepNumber: React.CSSProperties = { width: '24px', height: '24px', borderRadius: '50%', background: '#3498db', color: '#fff', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const stepContent: React.CSSProperties = { flexGrow: 1 };
const stepTitle: React.CSSProperties = { fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' };
const stepDesc: React.CSSProperties = { fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px 0' };

const codeBlock: React.CSSProperties = { background: '#000', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#2ecc71', fontFamily: 'monospace', fontSize: '13px' };

const fieldGroup: React.CSSProperties = { marginBottom: '12px' };
const fieldLabel: React.CSSProperties = { fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.5px' };
const fieldRow: React.CSSProperties = { display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' };
const fieldValue: React.CSSProperties = { flexGrow: 1, padding: '10px 12px', fontSize: '13px', color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const copyBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '0 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const successAlert: React.CSSProperties = { padding: '12px 15px', background: 'rgba(46, 204, 113, 0.05)', borderRadius: '10px', border: '1px solid rgba(46, 204, 113, 0.1)', color: '#2ecc71', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '10px', lineHeight: '1.4' };

const footerStyle: React.CSSProperties = { padding: '15px 25px 25px 25px', display: 'flex', justifyContent: 'center' };
const doneBtn: React.CSSProperties = { width: '100%', padding: '12px', background: '#3498db', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const closeBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' };

export default ConnectionGuide;
