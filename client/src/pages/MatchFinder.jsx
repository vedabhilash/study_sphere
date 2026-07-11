import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Calendar, BookOpen, Star, RefreshCw, Compass, ArrowRight, MessageSquare, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import Avatar from '../components/Avatar';
import './SkillMarketplace.css'; // Reuse marketplace card styling for consistency

const MatchFinder = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/matches');
      setMatches(response.data);
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Failed to retrieve compatible study partners.');
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  return (
    <div className="main-content animate-fade-in" style={{ padding: '32px' }}>
      {alert && (
        <div className={`form-alert ${alert.type}`} style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1100 }}>
          {alert.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="welcome-banner" style={{ marginBottom: '32px' }}>
        <h1 className="welcome-title">Peer Study Match Finder</h1>
        <p className="welcome-subtitle">We automatically cross-reference your courses, weekly schedules, study habits, and learning goals to identify compatible classmates.</p>
      </div>

      {loading ? (
        <div className="skeleton-loading-container">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <Info size={32} />
          <p>No matches found yet. Try listing more courses and availability slots in your profile configuration!</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Main matches column */}
          <div className="dashboard-panel" style={{ flex: 2 }}>
            <h2 className="dashboard-panel-title">
              <Sparkles size={20} style={{ color: 'var(--accent)' }} />
              <span>Highly Compatible Study Partners</span>
            </h2>

            <div className="mentor-cards-container" style={{ marginTop: '20px' }}>
              {matches.map((partner) => {
                const isPerfect = partner.matchScore >= 80;
                return (
                  <div key={partner._id} className="mentor-exchange-card">
                    <div className="mentor-card-header">
                      <Avatar src={partner.avatar} name={partner.name} size="48px" />
                      <div className="mentor-card-meta">
                        <h4 className="mentor-card-name">{partner.name}</h4>
                        <span className="mentor-card-sub">{partner.academicMajor || 'Undeclared'} • Year {partner.yearOfStudy || '1'}</span>
                      </div>
                      <div className="compatibility-badge-wrapper">
                        <span className={`compatibility-badge ${isPerfect ? 'perfect' : ''}`}>
                          {partner.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <span className="skill-section-lbl">Compatibility Points:</span>
                      <ul style={{ paddingLeft: '16px', marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {partner.matchReasons?.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mentor-card-footer">
                      <div className="mentor-rating-info">
                        <Star size={14} className="star-icon fill-amber" />
                        <span>{partner.rating > 0 ? partner.rating : 'New'} ({partner.completedSessions || 0} reviews)</span>
                      </div>
                      <a 
                        href={`mailto:${partner.email}`}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <MessageSquare size={14} />
                        <span>Send Invite</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick info card */}
          <div className="group-sidebar">
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 className="dashboard-panel-title" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <Compass size={16} />
                <span>Match Formula</span>
              </h3>
              <ul className="market-instructions" style={{ paddingLeft: '16px' }}>
                <li><strong>Course Overlap (40%)</strong>: Students sharing exact curriculum focus.</li>
                <li><strong>Availability (30%)</strong>: Common free study slots during the week.</li>
                <li><strong>Study Styles (20%)</strong>: Same or complementary learning methods (e.g. Visual & Discussion).</li>
                <li><strong>Learning Goals (10%)</strong>: Shared milestones and academic targets.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchFinder;
