import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  ArrowRight, 
  Clock, 
  Plus, 
  Lock, 
  Globe, 
  PlusCircle, 
  MessageSquare, 
  FileText,
  Award,
  Sparkles
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { groupsAPI, skillsAPI } from '../utils/apiService';
import './Dashboard.css';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [recommendedGroups, setRecommendedGroups] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setDashboardLoading(true);
      try {
        await refreshUser();
      } catch (err) {
        console.error('Error refreshing user details:', err);
      } finally {
        setDashboardLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Gather all upcoming sessions from joined groups
    const now = new Date();
    const sessions = [];

    (user.groupsJoined || []).forEach((group) => {
      if (group.sessions) {
        group.sessions.forEach((session) => {
          const startTime = new Date(session.startTime);
          if (startTime > now) {
            sessions.push({
              ...session,
              groupName: group.name,
              groupId: group._id
            });
          }
        });
      }
    });

    sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    setUpcomingSessions(sessions);

    // Generate recent activity feed
    const mockActivities = [];
    (user.groupsJoined || []).forEach((group) => {
      mockActivities.push({
        id: `join-${group._id}`,
        type: 'join',
        text: `You joined the study group "${group.name}"`,
        time: new Date(group.createdAt || Date.now() - 86400000 * 2),
        icon: <Users size={16} style={{ color: 'var(--primary)' }} />
      });

      if (group.sessions) {
        group.sessions.forEach((session) => {
          mockActivities.push({
            id: `session-${session._id}`,
            type: 'session',
            text: `A new session "${session.title}" was scheduled in "${group.name}"`,
            time: new Date(session.createdAt || Date.now() - 3600000 * 4),
            icon: <Calendar size={16} style={{ color: 'var(--accent)' }} />
          });
        });
      }
    });

    mockActivities.sort((a, b) => b.time - a.time);
    setActivities(mockActivities.slice(0, 5));

    // Fetch Recommended Groups & Exchange History
    const fetchExtraData = async () => {
      try {
        const publicGroups = await groupsAPI.getPublic();
        const joinedIds = new Set((user.groupsJoined || []).map(g => g._id));
        const userCourses = user.courses || [];
        
        // Recommend groups that match courses or subject
        const recs = publicGroups
          .filter(g => !joinedIds.has(g._id))
          .filter(g => 
            userCourses.some(c => 
              g.subject.toLowerCase().includes(c.toLowerCase()) || 
              g.name.toLowerCase().includes(c.toLowerCase())
            ) || true
          )
          .slice(0, 3);
        setRecommendedGroups(recs);

        const history = await skillsAPI.getHistory();
        if (history && history.requests) {
          setRecentRequests(history.requests.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching dashboard recommended data:', err);
      }
    };
    
    fetchExtraData();
  }, [user]);

  // Profile Completion % Computation
  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    let score = 0;
    if (user.bio) score += 15;
    if (user.academicMajor) score += 15;
    if (user.yearOfStudy) score += 15;
    if (user.university) score += 15;
    if (user.courses && user.courses.length > 0) score += 15;
    if (user.skillsCanTeach && user.skillsCanTeach.length > 0) score += 15;
    if (user.skillsToLearn && user.skillsToLearn.length > 0) score += 10;
    return score;
  }, [user]);

  if (dashboardLoading) {
    return (
      <div className="main-content animate-fade-in" style={{ padding: '32px' }}>
        <div className="dashboard-container">
          <Skeleton variant="text" height="40px" width="40%" style={{ marginBottom: '24px' }} />
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <Skeleton variant="card" height="90px" count={4} />
          </div>
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Skeleton variant="card" height="200px" />
              <Skeleton variant="card" height="150px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Skeleton variant="card" height="250px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalMembers = (user.groupsJoined || []).reduce((sum, group) => sum + (group.members?.length || 0), 0);

  return (
    <div className="main-content animate-fade-in">
      <div className="dashboard-container">
        
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <h1 className="welcome-title">Welcome back, {user.name}!</h1>
          <p className="welcome-subtitle">Ready for another collaborative study session? Let's check what's new.</p>
        </div>

        {/* Profile Completion Panel */}
        {profileCompletion < 100 && (
          <div className="glass-panel animate-fade-in" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)', border: '1px solid var(--border-color)' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Profile Setup Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{profileCompletion}% Complete</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#262626', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${profileCompletion}%`, height: '100%', background: '#ffffff', transition: 'width 0.4s ease' }} />
              </div>
            </div>
            <Link to="/profile/personal-details" className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
              Complete Profile
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{user.groupsJoined?.length || 0}</span>
              <span className="stat-label">Groups Joined</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)' }}>
              <Calendar size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{upcomingSessions.length}</span>
              <span className="stat-label">Upcoming Sessions</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <BookOpen size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{totalMembers}</span>
              <span className="stat-label">Total Peers</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff' }}>
              <PlusCircle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{user.credits || 0} CR</span>
              <span className="stat-label">Skill Credits</span>
            </div>
          </div>
        </div>

        {/* Two Column Dashboard Grid */}
        <div className="dashboard-grid">
          
          {/* Left Side: My Groups, Recommended Groups, & Skill Requests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* My Groups Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} style={{ color: 'var(--primary)' }} />
                  <span>My Study Groups</span>
                </h2>
                <Link to="/groups" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <Plus size={16} />
                  <span>Find/Create Group</span>
                </Link>
              </div>

              {user.groupsJoined?.length === 0 ? (
                <EmptyState 
                  icon={Users}
                  title="No Groups Joined"
                  description="Join a study group to share resources, chat, and schedule group video sessions."
                  actionText="Browse Groups"
                  onAction={() => window.location.href = '/groups'}
                  style={{ border: 'none', background: 'transparent', padding: '24px 0' }}
                />
              ) : (
                <div className="my-groups-grid">
                  {(user.groupsJoined || []).map((group) => (
                    <div key={group._id} className="dashboard-group-card">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="dashboard-group-name">{group.name}</span>
                          {group.isPrivate ? (
                            <Lock size={14} style={{ color: 'var(--text-muted)' }} title="Private" />
                          ) : (
                            <Globe size={14} style={{ color: 'var(--text-muted)' }} title="Public" />
                          )}
                        </div>
                        <span className="dashboard-group-subj">{group.subject}</span>
                      </div>
                      
                      <div className="dashboard-group-bottom">
                        <span>{group.members?.length || 0} members</span>
                        <Link 
                          to={`/groups/${group._id}`} 
                          style={{ 
                            color: 'var(--primary-light)', 
                            fontWeight: 600, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px' 
                          }}
                        >
                          <span>Enter</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Groups Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Sparkles size={20} style={{ color: 'var(--accent)' }} />
                <span>Recommended Groups for You</span>
              </h2>

              {recommendedGroups.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '12px 0' }}>
                  No recommendations. Add more courses to your profile to get matches!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recommendedGroups.map((group) => (
                    <div key={group._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', display: 'block' }}>{group.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{group.subject} • {group.members?.length || 0} members</span>
                      </div>
                      <Link to="/groups" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                        Browse
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Skill Requests */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <MessageSquare size={20} style={{ color: 'var(--success)' }} />
                <span>Skill Requests</span>
              </h2>

              {recentRequests.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '12px 0' }}>
                  No recent exchange requests. Try requesting a skill swap in the Marketplace.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentRequests.map((req) => {
                    const isSender = req.sender?._id === user._id;
                    const partner = isSender ? req.receiver : req.sender;
                    return (
                      <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                            {isSender ? 'Sent to' : 'Received from'} {partner?.name}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Skill Swap: {req.skill} ({req.status})
                          </span>
                        </div>
                        <Link to="/marketplace" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          Manage
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Side: Upcoming Sessions, Skill Swap Analytics, & Recent Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Upcoming Sessions */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 className="dashboard-panel-title">
                <Calendar size={18} style={{ color: 'var(--success)' }} />
                <span>Upcoming Sessions</span>
              </h2>

              {upcomingSessions.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px 16px' }}>
                  <Calendar size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                  <p>No sessions scheduled soon.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Enter a study group to schedule one!</p>
                </div>
              ) : (
                <div className="session-widget-list">
                  {upcomingSessions.map((session) => {
                    const start = new Date(session.startTime);
                    return (
                      <div key={session._id} className="session-widget-item">
                        <span className="session-widget-title">{session.title}</span>
                        <span className="session-widget-group">Group: {session.groupName}</span>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span className="session-widget-time">
                            <Clock size={12} />
                            <span>
                              {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at{' '}
                              {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                          <Link 
                            to={`/groups/${session.groupId}?tab=sessions`}
                            style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}
                          >
                            RSVP
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Skill Analytics Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 className="dashboard-panel-title">
                <Award size={18} style={{ color: '#ffffff' }} />
                <span>Skill Swap Analytics</span>
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#121212', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'block' }}>{user.skillsCanTeach?.length || 0}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Skills Taught</span>
                  </div>
                  <div style={{ background: '#121212', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'block' }}>{user.skillsToLearn?.length || 0}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Skills Learning</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#121212', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'block' }}>{user.completedSessions || 0}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sessions Done</span>
                  </div>
                  <div style={{ background: '#121212', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'block' }}>★ {user.rating > 0 ? user.rating : 'N/A'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mentor Rating</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Top Badges</span>
                  {user.mentorBadges && user.mentorBadges.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {user.mentorBadges.slice(0, 3).map(badge => (
                        <span key={badge} className="tag-badge" style={{ fontSize: '0.7rem', background: '#ffffff', color: '#000000', fontWeight: 'bold' }}>{badge}</span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>No badges earned yet.</span>
                  )}
                </div>

                <Link to="/marketplace" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'block', padding: '8px', fontSize: '0.85rem' }}>
                  Browse Marketplace
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 className="dashboard-panel-title">
                <Clock size={18} style={{ color: 'var(--accent)' }} />
                <span>Recent Activity</span>
              </h2>

              {activities.length === 0 ? (
                <div className="empty-state">
                  <p>No recent activity. Activities appear as you interact with your groups!</p>
                </div>
              ) : (
                <div className="activity-feed-list">
                  {activities.map((act) => (
                    <div key={act.id} className="activity-item">
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        flexShrink: 0
                      }}>
                        {act.icon}
                      </div>
                      <div className="activity-details">
                        <span className="activity-text">{act.text}</span>
                        <span className="activity-time">
                          {new Date(act.time).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
