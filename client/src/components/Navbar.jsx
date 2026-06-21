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
  currentStudent,
  unreadGroups = {},
  onClearGroupUnread,
  notifications = {}
}) {
  const totalDirectNotifications = React.useMemo(() => {
    return Object.values(notifications).reduce((acc, count) => acc + count, 0);
  }, [notifications]);

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
          style={{ position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <Compass size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: 'left' }}>Match Finder</span>
            {totalDirectNotifications > 0 && (
              <span className="badge" style={{ 
                background: '#ff4d4f', 
                color: 'white', 
                borderRadius: '10px', 
                padding: '2px 6px', 
                fontSize: '0.65rem', 
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {totalDirectNotifications}
              </span>
            )}
          </div>
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
                  if (onClearGroupUnread) onClearGroupUnread(group.id);
                }}
                className={`workspace-item ${activeTab === 'workspace' && activeGroup?.id === group.id ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', width: '100%' }}>
                  <BookOpen size={14} style={{ flexShrink: 0 }} />
                  <span style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    fontWeight: activeGroup?.id === group.id ? '600' : 'normal',
                    flex: 1
                  }}>
                    {group.name}
                  </span>
                  {unreadGroups && unreadGroups[group.id] > 0 && (
                    <span className="badge" style={{ 
                      background: '#ff4d4f', 
                      color: 'white', 
                      borderRadius: '10px', 
                      padding: '2px 6px', 
                      fontSize: '0.65rem', 
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {unreadGroups[group.id]}
                    </span>
                  )}
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
