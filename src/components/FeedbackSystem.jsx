import React from 'react';
import { Star, MessageSquare, Award, CheckCircle2, History } from 'lucide-react';

export default function FeedbackSystem({ group, currentStudent, onSubmitFeedback }) {
  const [sessionRating, setSessionRating] = React.useState(0);
  const [matchRating, setMatchRating] = React.useState(0);
  const [comments, setComments] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  // Mock feedback history in this workspace
  const [feedbackLogs, setFeedbackLogs] = React.useState([
    {
      id: 1,
      date: '2026-06-15',
      sessionRating: 5,
      matchRating: 4,
      comments: 'Great review session! We solved all the exercises for integration by parts.'
    },
    {
      id: 2,
      date: '2026-06-08',
      sessionRating: 4,
      matchRating: 5,
      comments: 'Very compatible group! Everyone turned on their videos and the whiteboard drawing was useful.'
    }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sessionRating === 0 || matchRating === 0) return;

    const feedbackObj = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      sessionRating,
      matchRating,
      comments: comments.trim()
    };

    // Save locally
    setFeedbackLogs(prev => [feedbackObj, ...prev]);
    onSubmitFeedback(group.id, feedbackObj);
    
    // Reset and show success banner
    setSessionRating(0);
    setMatchRating(0);
    setComments('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const renderStars = (rating, setRating, interactive = true) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isActive = starValue <= rating;
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => interactive && setRating(starValue)}
              className={`star-btn ${isActive ? 'active' : ''}`}
              disabled={!interactive}
              style={{ padding: 0 }}
            >
              <Star 
                size={22} 
                fill={isActive ? 'var(--warning)' : 'none'} 
                stroke={isActive ? 'var(--warning)' : 'var(--text-muted)'} 
              />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '2rem' }}>
      
      {/* Left Column: Form */}
      <div className="glass-card">
        <h3>Rate Recent Study Session</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Provide feedback on your group sessions. This data optimizes matching weights, helping pair you with even more compatible students over time.
        </p>

        {submitted && (
          <div 
            style={{ 
              background: 'rgba(16, 185, 129, 0.08)', 
              border: '1px solid rgba(16, 185, 129, 0.2)', 
              color: '#5cd5a3',
              borderRadius: 'var(--radius-sm)', 
              padding: '1rem', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <CheckCircle2 size={16} />
            <span>Thank you! Your feedback has been saved and will improve future matches.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Session Usefulness</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              How helpful was this session in achieving your academic objectives?
            </p>
            {renderStars(sessionRating, setSessionRating)}
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '0.25rem' }}>Member Compatibility</label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Were the other group members academically and schedule compatible?
            </p>
            {renderStars(matchRating, setMatchRating)}
          </div>

          <div className="form-group">
            <label className="form-label">Review & Comments</label>
            <textarea
              placeholder="What did you learn? Mention anything that could improve matching (e.g. schedules didn't line up, or pace was too fast/slow)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="form-textarea"
              rows="3"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={sessionRating === 0 || matchRating === 0}
            style={{ width: '100%', opacity: (sessionRating === 0 || matchRating === 0) ? 0.5 : 1 }}
          >
            <span>Submit Session Feedback</span>
          </button>
        </form>
      </div>

      {/* Right Column: History list */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <History size={18} className="text-primary" />
          <h3 style={{ margin: 0 }}>Feedback History Log</h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Reviews submitted for the <strong>{group.name}</strong> workspace:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {feedbackLogs.map(log => (
            <div 
              key={log.id} 
              style={{ 
                padding: '1rem', 
                background: 'rgba(0, 0, 0, 0.15)', 
                border: '1px solid var(--border-glass)', 
                borderRadius: 'var(--radius-sm)' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{log.date}</span>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Session: {log.sessionRating}★
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Match: {log.matchRating}★
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{log.comments}"
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
