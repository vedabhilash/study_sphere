import React from 'react';
import { 
  User, 
  Users, 
  Compass, 
  GraduationCap, 
  BookOpen
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  activeGroup, 
  setActiveGroup, 
  joinedGroups, 
  currentStudent 
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <GraduationCap size={28} className="text-primary" style={{ color: 'var(--primary)' }} />
        <span className="logo-text">StudySphere</span>
      </div>

      <nav className="sidebar-nav">
        <button 
          onClick={() => {
            setActiveTab('profile');
            setActiveGroup(null);
          }}
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <User size={18} />
          <span>My Profile</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('matches');
            setActiveGroup(null);
          }}
          className={`nav-item ${activeTab === 'matches' ? 'active' : ''}`}
        >
          <Compass size={18} />
          <span>Match Finder</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('groups');
            setActiveGroup(null);
          }}
          className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Group Directory</span>
        </button>

        <div className="sidebar-section-title">My Workspaces</div>
        <div className="workspace-list">
          {joinedGroups.length === 0 ? (
            <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No groups joined yet
            </div>
          ) : (
            joinedGroups.map(group => (
              <div 
                key={group.id}
                onClick={() => {
                  setActiveGroup(group);
                  setActiveTab('workspace');
                }}
                className={`workspace-item ${activeTab === 'workspace' && activeGroup?.id === group.id ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <BookOpen size={14} style={{ flexShrink: 0 }} />
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    fontWeight: activeGroup?.id === group.id ? '600' : 'normal'
                  }}>
                    {group.name}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">
          {currentStudent?.avatar || 'ST'}
        </div>
        <div className="user-info">
          <span className="user-name">{currentStudent?.name || 'Student Name'}</span>
          <span className="user-role">{currentStudent?.major || 'Undeclared'}</span>
        </div>
      </div>
    </aside>
  );
}
