import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MobileHeader.css';

const MobileHeader = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="top-header-wrapper">
      {/* Main Header Bar */}
      <header className="mobile-header">
        <div className="header-left">
          <button className="mobile-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle Navigation Menu">
            <Menu size={24} />
          </button>

          <div className="mobile-brand-container">
            <span className="brand-primary">STUDYSPHERE</span>
            <span className="brand-accent">RAW</span>
          </div>
        </div>
      </header>
    </div>
  );
};

export default MobileHeader;
