import React from 'react';

export default function EmptyState({ icon: Icon, title, description, actionText, onAction, style }) {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        maxWidth: '500px',
        margin: '24px auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        ...style
      }}
      className="empty-state-container"
    >
      {Icon && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid #262626',
          marginBottom: '16px',
          color: 'var(--text-secondary)'
        }}>
          <Icon size={32} />
        </div>
      )}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '350px', marginBottom: '20px', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          {actionText}
        </button>
      )}
    </div>
  );
}
