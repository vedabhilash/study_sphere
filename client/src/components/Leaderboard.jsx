import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Avatar from './Avatar';
import { Trophy, Star, Award, ShieldAlert, BookOpen } from 'lucide-react';
import '../pages/SkillMarketplace.css';

const Leaderboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopStudents();
  }, []);

  const fetchTopStudents = async () => {
    try {
      const response = await axios.get('/api/marketplace/search');
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to load leaderboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const getTopRated = () => {
    return [...students]
      .filter(s => s.rating > 0)
      .sort((a, b) => b.rating - a.rating || b.completedSessions - a.completedSessions)
      .slice(0, 5);
  };

  const getTopCredits = () => {
    return [...students]
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 5);
  };

  if (loading) {
    return <div className="skeleton-loading-container"><div className="skeleton-card" /></div>;
  }

  return (
    <div className="dashboard-grid">
      {/* Column 1: Rating Champions */}
      <div className="dashboard-panel">
        <h3 className="dashboard-panel-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <Star size={20} className="star-icon" />
          <span>Top Rated Mentors</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {getTopRated().map((student, index) => (
            <div key={student._id} className="preference-card" style={{ padding: '12px 16px', justifyContent: 'space-between', borderLeft: index === 0 ? '4px solid #fbbf24' : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: '800', color: index === 0 ? '#fbbf24' : '#fff', fontSize: '1.1rem', minWidth: '20px' }}>#{index + 1}</span>
                <Avatar src={student.avatar} name={student.name} size="36px" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{student.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.academicMajor || 'Undeclared'}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: '800', color: '#fff', display: 'block' }}>★ {student.rating}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.completedSessions || 0} completed swaps</span>
              </div>
            </div>
          ))}
          {getTopRated().length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No ratings submitted yet.</p>}
        </div>
      </div>

      {/* Column 2: Credit Leaders */}
      <div className="dashboard-panel">
        <h3 className="dashboard-panel-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <Trophy size={20} style={{ color: '#fff' }} />
          <span>Knowledge Credits Leaders</span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          {getTopCredits().map((student, index) => (
            <div key={student._id} className="preference-card" style={{ padding: '12px 16px', justifyContent: 'space-between', borderLeft: index === 0 ? '4px solid #fff' : '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: '800', color: index === 0 ? '#fff' : '#888', fontSize: '1.1rem', minWidth: '20px' }}>#{index + 1}</span>
                <Avatar src={student.avatar} name={student.name} size="36px" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{student.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{student.academicMajor || 'Undeclared'}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: '800', color: '#fff', display: 'block' }}>{student.credits || 0} CR</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Credit Balance</span>
              </div>
            </div>
          ))}
          {getTopCredits().length === 0 && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No credits recorded.</p>}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
