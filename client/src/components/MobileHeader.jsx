import React from 'react';
import { Menu, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './MobileHeader.css';

const MobileHeader = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  if (!user) return null;

  const getAvatarSource = () => {
    if (user.avatar) return user.avatar;
    return null;
  };

  const getInitials = () => {
    return user.name ? user.name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header className="mobile-header">
      <button className="mobile-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle Navigation Menu">
        <Menu size={24} />
      </button>

      <div className="mobile-brand-container">
        <GraduationCap className="mobile-brand-logo" size={24} />
        <span className="mobile-brand-title">StudySphere</span>
      </div>

      <Link to="/profile/personal-details" className="mobile-profile-link">
        {getAvatarSource() ? (
          <img 
            src={getAvatarSource()} 
            alt={user.name} 
            className="mobile-avatar"
          />
        ) : (
          <div className="mobile-avatar-placeholder">
            {getInitials()}
          </div>
        )}
      </Link>
    </header>
  );
};

export default MobileHeader;
