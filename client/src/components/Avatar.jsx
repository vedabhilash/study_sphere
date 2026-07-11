import React, { useState } from 'react';

const colors = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#34d399', // emerald
  '#2dd4bf', // teal
  '#38bdf8', // sky
  '#60a5fa', // blue
  '#818cf8', // indigo
  '#a78bfa', // purple
  '#f472b6', // pink
];

const getAvatarColor = (name) => {
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getInitials = (name) => {
  if (!name) return '?';
  const cleanName = name.trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length > 1 && parts[0] && parts[1]) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return cleanName.charAt(0).toUpperCase();
};

const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${import.meta.env.VITE_API_URL || ''}${url}`;
};

export const Avatar = ({ src, name, size = '32px', className = '', style = {} }) => {
  const [isBroken, setIsBroken] = useState(false);

  // Check if there is a valid uploaded avatar. 
  // Custom uploaded files will have longer paths (e.g. contains '/uploads/' or length > 3).
  // Initial placeholders (like 'AR', 'VE') or defaults will not count as uploaded images.
  const hasUploadedAvatar = src && 
    src.length > 3 && 
    !src.includes('ui-avatars.com') && 
    !src.includes('via.placeholder.com');

  if (hasUploadedAvatar && !isBroken) {
    return (
      <img
        src={getFullUrl(src)}
        alt={name}
        onError={() => setIsBroken(true)}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid var(--border-color)',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  const initials = getInitials(name);
  const backgroundColor = getAvatarColor(name);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor,
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: `calc(${size} * 0.42)`,
        userSelect: 'none',
        flexShrink: 0,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: 'var(--font-sans)',
        textTransform: 'uppercase',
        ...style
      }}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
