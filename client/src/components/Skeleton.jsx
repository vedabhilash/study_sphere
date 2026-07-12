import React from 'react';

export default function Skeleton({ variant = 'text', width, height, count = 1, style }) {
  const elements = Array.from({ length: count });

  const getStyle = () => {
    let base = {
      display: 'block',
      width: width || '100%',
      height: height || (variant === 'avatar' ? '40px' : variant === 'card' ? '150px' : '16px'),
      borderRadius: variant === 'avatar' ? '50%' : '4px',
      margin: '8px 0',
      background: 'linear-gradient(90deg, #121212 25%, #1c1c1c 50%, #121212 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite linear',
      border: '1px solid #262626',
      ...style
    };
    return base;
  };

  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {elements.map((_, i) => (
        <div key={i} style={getStyle()} className="skeleton-loader-item" />
      ))}
    </>
  );
}
