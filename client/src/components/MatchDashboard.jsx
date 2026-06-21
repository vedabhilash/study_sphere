import React from 'react';
import { Search, MessageSquare, Plus, Check, SlidersHorizontal, BookOpen, AlertCircle } from 'lucide-react';
import { getSortedMatches } from '../utils/matchingAlgorithm';

export default function MatchDashboard({ 
  currentStudent, 
  allStudents, 
  joinedGroups, 
  onInviteToGroup, 
  onOpenQuickChat,
  notifications = {}
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [courseFilter, setCourseFilter] = React.useState('All');
  
  // Modal State for Group Invitation
  const [invitingStudent, setInvitingStudent] = React.useState(null);

  // Compute matches
  const matches = React.useMemo(() => {
    if (!currentStudent) return [];
    return getSortedMatches(currentStudent, allStudents);
  }, [currentStudent, allStudents]);

  // Unique course list from current student's courses to filter by
  const userCourses = currentStudent?.courses || [];

  // Filter matches
  const filteredMatches = React.useMemo(() => {
    return matches.filter(match => {
      // 1. Search Query
      const matchesSearch = match.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            match.major.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Course Filter
      const matchesCourse = courseFilter === 'All' || 
                            (match.courses && match.courses.includes(courseFilter));

      // 3. Privacy control: only display public profiles
      const isVisible = match.privacy?.visibility !== 'private';

      return matchesSearch && matchesCourse && isVisible;
    });
  }, [matches, searchQuery, courseFilter]);

  const handleOpenInvite = (student) => {
    setInvitingStudent(student);
  };

  const handleSendInvite = (group) => {
    if (invitingStudent) {
      onInviteToGroup(invitingStudent.id, group.id);
      setInvitingStudent(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Match Finder</h1>
          <p>Find peer students who match your courses, weekly study availability, and educational goals.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card directory-actions" style={{ marginBottom: '2rem' }}>
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search matches by name, major..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter by Course:</span>
          <select 
            value={courseFilter} 
            onChange={(e) => setCourseFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="All">All Shared Courses</option>
            {userCourses.map(c => (
              <option key={c} value={c}>{c.split(':')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No study partners found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Try updating your profile details, enrolled courses, or checking your filters.
          </p>
        </div>
      ) : (
        <div className="match-grid">
          {filteredMatches.map(student => {
            const isHighMatch = student.matchScore >= 70;
            return (
              <div key={student.id} className="glass-card match-card">
                {/* Match Score Badge */}
                <div className={`match-score-radial ${isHighMatch ? 'high' : ''}`}>
                  <span className="match-score-value">{student.matchScore}%</span>
                  <span className="match-score-label">Match</span>
                </div>

                <div className="match-info">
                  <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                    {student.avatar}
                  </div>
                  <div className="match-details">
                    <h3>{student.name}</h3>
                    <p>{student.major}</p>
                  </div>
                </div>

                <div className="match-bio">
                  {student.bio || "No bio provided."}
                </div>

                {/* Compatibility Checklist */}
                <div className="match-reasons-list">
                  {student.matchReasons && student.matchReasons.length > 0 ? (
                    student.matchReasons.map((reason, idx) => (
                      <div key={idx} className="match-reason-item">
                        <Check size={14} />
                        <span>{reason}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Simple course alignment
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="match-actions">
                  <button 
                    onClick={() => onOpenQuickChat(student)}
                    className="btn btn-secondary"
                    style={{ position: 'relative' }}
                  >
                    <MessageSquare size={16} />
                    <span>Chat</span>
                    {notifications && notifications[student.id] > 0 && (
                      <span className="badge" style={{ 
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ff4d4f', 
                        color: 'white', 
                        borderRadius: '10px', 
                        padding: '2px 6px', 
                        fontSize: '0.65rem', 
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(255, 77, 79, 0.4)'
                      }}>
                        {notifications[student.id]}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => handleOpenInvite(student)}
                    className="btn btn-primary"
                  >
                    <Plus size={16} />
                    <span>Invite</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      {invitingStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Invite {invitingStudent.name}</h3>
              <button onClick={() => setInvitingStudent(null)} className="modal-close">×</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Choose which study group you want to invite <strong>{invitingStudent.name}</strong> to join. They will be added immediately.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {joinedGroups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                  You are not a member of any study groups. Create one in the Group Directory first!
                </div>
              ) : (
                joinedGroups.map(group => {
                  const isAlreadyMember = group.members.includes(invitingStudent.id);
                  const isFull = group.members.length >= group.maxSize;
                  
                  return (
                    <div 
                      key={group.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{group.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {group.members.length} / {group.maxSize} members
                        </div>
                      </div>
                      
                      {isAlreadyMember ? (
                        <span className="badge badge-success">Already Joined</span>
                      ) : isFull ? (
                        <span className="badge badge-warning">Group Full</span>
                      ) : (
                        <button
                          onClick={() => handleSendInvite(group)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          Send Invite
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
