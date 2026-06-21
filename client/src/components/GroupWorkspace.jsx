import React from 'react';
import { 
  BookOpen, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Video, 
  FileText, 
  CheckSquare, 
  Award, 
  Users, 
  Clock, 
  Sliders 
} from 'lucide-react';

import ChatView from './ChatView';
import CalendarView from './CalendarView';
import VirtualRoom from './VirtualRoom';
import ResourceSharing from './ResourceSharing';
import GoalTracker from './GoalTracker';
import FeedbackSystem from './FeedbackSystem';

export default function GroupWorkspace({ 
  group, 
  currentStudent, 
  allStudents, 
  socket,
  onSendMessage, 
  onScheduleMeeting, 
  onAddResource, 
  onUpvoteResource, 
  onAddGoal, 
  onToggleSubtask, 
  onDeleteGoal, 
  onLeaveGroup, 
  onSubmitFeedback 
}) {
  const [activeSubTab, setActiveSubTab] = React.useState('dashboard');

  // Sync back to dashboard tab if group changes
  React.useEffect(() => {
    setActiveSubTab('dashboard');
  }, [group.id]);

  // Profiles of members in the group
  const groupMembers = React.useMemo(() => {
    return group.members.map(id => {
      return allStudents.find(s => s.id === id) || { name: 'Student Name', avatar: '?', major: 'Undeclared' };
    });
  }, [group.members, allStudents]);

  // Compute goals metrics
  const goalsMetrics = React.useMemo(() => {
    const goals = group.goals || [];
    if (goals.length === 0) return { count: 0, completed: 0, percent: 0 };
    
    let totalSub = 0;
    let completedSub = 0;
    
    goals.forEach(g => {
      totalSub += g.subtasks.length;
      completedSub += g.subtasks.filter(s => s.completed).length;
    });

    return {
      count: goals.length,
      completed: goals.filter(g => g.subtasks.every(s => s.completed) && g.subtasks.length > 0).length,
      percent: totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0
    };
  }, [group.goals]);

  // Get next upcoming meeting
  const nextMeeting = React.useMemo(() => {
    const meetings = group.meetings || [];
    if (meetings.length === 0) return null;
    
    // Sort by date
    return [...meetings].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }, [group.meetings]);

  return (
    <div>
      {/* Group Header Banner */}
      <div 
        className="glass-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          borderColor: 'var(--border-hover)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <span className="badge badge-accent" style={{ marginBottom: '0.5rem' }}>
            {group.course}
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{group.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', maxWidth: '600px' }}>
            {group.description}
          </p>
        </div>

        <button 
          onClick={() => onLeaveGroup(group.id)} 
          className="btn btn-danger"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          Leave Workspace
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="workspace-tabs">
        <button 
          onClick={() => setActiveSubTab('dashboard')} 
          className={`workspace-tab ${activeSubTab === 'dashboard' ? 'active' : ''}`}
        >
          <Sliders size={16} />
          <span>Workspace Home</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('chat')} 
          className={`workspace-tab ${activeSubTab === 'chat' ? 'active' : ''}`}
        >
          <MessageSquare size={16} />
          <span>Group Chat</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('calendar')} 
          className={`workspace-tab ${activeSubTab === 'calendar' ? 'active' : ''}`}
        >
          <CalendarIcon size={16} />
          <span>Shared Calendar</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('virtual')} 
          className={`workspace-tab ${activeSubTab === 'virtual' ? 'active' : ''}`}
        >
          <Video size={16} />
          <span>Virtual Room</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('resources')} 
          className={`workspace-tab ${activeSubTab === 'resources' ? 'active' : ''}`}
        >
          <FileText size={16} />
          <span>Resource Library</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('goals')} 
          className={`workspace-tab ${activeSubTab === 'goals' ? 'active' : ''}`}
        >
          <CheckSquare size={16} />
          <span>Goal Tracker</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('feedback')} 
          className={`workspace-tab ${activeSubTab === 'feedback' ? 'active' : ''}`}
        >
          <Award size={16} />
          <span>Session Ratings</span>
        </button>
      </div>

      {/* Workspace Panel Switcher */}
      <div className="workspace-view-content">
        
        {activeSubTab === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Dashboard Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Next Meeting Summary */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <CalendarIcon size={18} className="text-primary" />
                  <h3 style={{ margin: 0 }}>Next Scheduled Call</h3>
                </div>

                {nextMeeting ? (
                  <div 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid var(--border-glass)', 
                      padding: '1.25rem', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{nextMeeting.title}</h4>
                      <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} />
                          {nextMeeting.date} ({nextMeeting.time})
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveSubTab('virtual')}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      <Video size={14} />
                      <span>Join Room</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    <span>No upcoming study sessions scheduled. </span>
                    <button 
                      onClick={() => setActiveSubTab('calendar')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      Propose a slot
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                
                {/* Goal Metric Card */}
                <div className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckSquare size={18} style={{ color: 'var(--accent)' }} />
                    <h4 style={{ margin: 0 }}>Goal Progress</h4>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0' }}>
                    {goalsMetrics.percent}%
                  </div>
                  <div className="goal-progress-bar-bg" style={{ marginBottom: '0.5rem' }}>
                    <div className="goal-progress-bar-fill" style={{ width: `${goalsMetrics.percent}%` }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {goalsMetrics.completed} / {goalsMetrics.count} group goals completed
                  </span>
                </div>

                {/* Resource Library Metric Card */}
                <div className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <FileText size={18} style={{ color: 'var(--success)' }} />
                    <h4 style={{ margin: 0 }}>Shared Resources</h4>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0' }}>
                    {group.resources.length}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Study notes, references, and websites shared by group members.
                  </p>
                  <button 
                    onClick={() => setActiveSubTab('resources')}
                    style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Browse Library &rarr;
                  </button>
                </div>

              </div>

            </div>

            {/* Dashboard Right Column: Group Roster */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Users size={18} className="text-primary" />
                <h3 style={{ margin: 0 }}>Group Members</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupMembers.map(member => (
                  <div 
                    key={member.id} 
                    style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-glass)'
                    }}
                  >
                    <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                      {member.avatar || 'SB'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.name} {member.id === currentStudent.id && '(You)'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.major || 'Pre-Major'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'chat' && (
          <ChatView 
            group={group} 
            currentStudent={currentStudent} 
            allStudents={allStudents} 
            onSendMessage={onSendMessage} 
          />
        )}

        {activeSubTab === 'calendar' && (
          <CalendarView 
            group={group} 
            currentStudent={currentStudent} 
            allStudents={allStudents} 
            onScheduleMeeting={onScheduleMeeting} 
          />
        )}

        {activeSubTab === 'virtual' && (
          <VirtualRoom 
            group={group} 
            currentStudent={currentStudent} 
            allStudents={allStudents} 
            socket={socket}
          />
        )}

        {activeSubTab === 'resources' && (
          <ResourceSharing 
            group={group} 
            currentStudent={currentStudent} 
            onAddResource={onAddResource} 
            onUpvoteResource={onUpvoteResource} 
          />
        )}

        {activeSubTab === 'goals' && (
          <GoalTracker 
            group={group} 
            onAddGoal={onAddGoal} 
            onToggleSubtask={onToggleSubtask} 
            onDeleteGoal={onDeleteGoal} 
          />
        )}

        {activeSubTab === 'feedback' && (
          <FeedbackSystem 
            group={group} 
            currentStudent={currentStudent} 
            onSubmitFeedback={onSubmitFeedback} 
          />
        )}

      </div>
    </div>
  );
}
