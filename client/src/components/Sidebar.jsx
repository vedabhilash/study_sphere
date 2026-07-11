import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { 
  GraduationCap, 
  LayoutDashboard, 
  User, 
  BookOpen, 
  Sliders, 
  Calendar, 
  ShieldAlert, 
  Sparkles, 
  Users, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileExpanded, setProfileExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={handleLinkClick}>
            <span className="brand-primary">STUDYSPHERE</span>
            <span className="brand-accent">RAW</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <NavLink 
              to="/" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              end
              onClick={handleLinkClick}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            {/* Profile Section with Dropdown/Accordion */}
            <div className="sidebar-dropdown-wrapper">
              <button 
                className={`sidebar-link dropdown-toggle ${profileExpanded ? 'expanded' : ''}`}
                onClick={() => setProfileExpanded(!profileExpanded)}
              >
                <div className="profile-toggle-content">
                  <User size={18} />
                  <span className="profile-toggle-label">Profile</span>
                </div>
                {profileExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {profileExpanded && (
                <div className="sidebar-sublinks animate-slide-down">
                  <NavLink 
                    to="/profile/personal-details" 
                    className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="bullet">•</span>
                    <span>Personal Details</span>
                  </NavLink>

                  <NavLink 
                    to="/profile/courses" 
                    className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="bullet">•</span>
                    <span>My Courses</span>
                  </NavLink>

                  <NavLink 
                    to="/profile/preferences" 
                    className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="bullet">•</span>
                    <span>Study Preferences</span>
                  </NavLink>

                  <NavLink 
                    to="/profile/availability" 
                    className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="bullet">•</span>
                    <span>Weekly Availability</span>
                  </NavLink>

                  <NavLink 
                    to="/profile/privacy" 
                    className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <span className="bullet">•</span>
                    <span>Privacy & Visibility</span>
                  </NavLink>
                </div>
              )}
            </div>

            <NavLink 
              to="/match-finder" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <Sparkles size={18} />
              <span>Match Finder</span>
            </NavLink>

            <NavLink 
              to="/groups" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <Users size={18} />
              <span>Group Directory</span>
            </NavLink>

            <NavLink 
              to="/settings" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
            {/* Profile Navigation Group */}
            <div style={{ display: 'none' }}></div>
          </div>
        </nav>

        {/* Sidebar Footer - User Profile */}
        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <Avatar src={user.avatar} name={user.name} size="40px" />
            <div className="user-profile-details">
              <span className="user-profile-name" title={user.name}>{user.name}</span>
              <span className="user-profile-email" title={user.email}>{user.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-btn-logout" title="Logout">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
