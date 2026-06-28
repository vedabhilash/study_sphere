import React from 'react';
import { Sparkles, Compass } from 'lucide-react';

const MatchFinder = () => {
  return (
    <div className="main-content animate-fade-in" style={{ padding: '32px' }}>
      <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            background: 'rgba(6, 182, 212, 0.1)', 
            color: 'var(--accent)', 
            padding: '20px', 
            borderRadius: '50%',
            boxShadow: '0 0 20px var(--accent-glow)'
          }}>
            <Sparkles size={48} />
          </div>
          
          <h1 style={{ fontSize: '2.5rem', marginTop: '10px' }}>Match Finder</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', lineHeight: '1.6' }}>
            Find the perfect study partners based on your courses, availability, and study preferences. Coming very soon!
          </p>
          
          <div className="tag-badge-accent" style={{ padding: '8px 16px', fontSize: '0.85rem', marginTop: '10px' }}>
            <Compass size={14} style={{ marginRight: '6px' }} />
            <span>INTEGRATING MATCH ALGORITHM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchFinder;
