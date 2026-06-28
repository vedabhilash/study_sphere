import React from 'react';
import { Settings, Wrench } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="main-content animate-fade-in" style={{ padding: '32px' }}>
      <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            background: 'rgba(99, 102, 241, 0.1)', 
            color: 'var(--primary)', 
            padding: '20px', 
            borderRadius: '50%',
            boxShadow: '0 0 20px var(--primary-glow)'
          }}>
            <Settings size={48} />
          </div>
          
          <h1 style={{ fontSize: '2.5rem', marginTop: '10px' }}>Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', lineHeight: '1.6' }}>
            Configure your application preferences, account security, and notification channels. Coming soon!
          </p>
          
          <div className="tag-badge" style={{ padding: '8px 16px', fontSize: '0.85rem', marginTop: '10px' }}>
            <Wrench size={14} style={{ marginRight: '6px' }} />
            <span>UNDER CONSTRUCTION</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
