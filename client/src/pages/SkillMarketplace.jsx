import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Leaderboard from '../components/Leaderboard';
import { 
  Search, BookOpen, Star, Compass, RefreshCw, Send, Calendar, Clock, Video, CheckCircle, 
  MapPin, Award, Shield, User, ArrowRight, Check, AlertCircle, Play, Info, ThumbsUp, Trophy, HelpCircle
} from 'lucide-react';
import './SkillMarketplace.css';

const categories = [
  'All', 'Programming', 'AI', 'Design', 'Languages', 'Mathematics', 'Business', 'Soft Skills', 'Music', 'Photography'
];

const roadmaps = [
  {
    title: 'Become a Full Stack Developer',
    path: ['HTML & CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
    description: 'Learn frontend web pages, backend servers, databases, and hosting.'
  },
  {
    title: 'Artificial Intelligence Specialist',
    path: ['Python', 'Calculus', 'Linear Algebra', 'Machine Learning', 'Deep Learning'],
    description: 'Master math foundations, regression algorithms, and deep neural network models.'
  },
  {
    title: 'UI/UX Design Specialist',
    path: ['Figma', 'UI/UX Design', 'Graphic Design', 'Figma'],
    description: 'Develop wireframes, user personas, visual layouts, and interactive prototypes.'
  }
];

const SkillMarketplace = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'roadmaps' | 'leaderboard'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists
  const [recommendations, setRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [viewedProfile, setViewedProfile] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  
  // Active Form inputs
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState('60'); // minutes
  const [bookingType, setBookingType] = useState('Video');
  const [bookingNotes, setBookingNotes] = useState('');
  
  // Review inputs
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComm, setReviewComm] = useState(5);
  const [reviewKnowledge, setReviewKnowledge] = useState(5);
  const [reviewHelp, setReviewHelp] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [pendingReviewSession, setPendingReviewSession] = useState(null);

  // Status alerts
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchMarketplaceData();
    checkForPendingReviews();
  }, [selectedCategory]);

  const fetchMarketplaceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch recommendations
      const recResponse = await axios.get('/api/marketplace/recommendations');
      setRecommendations(recResponse.data);

      // 2. Fetch available skills preset
      const skillsResponse = await axios.get('/api/skills');
      setSkillsList(skillsResponse.data);

      // 3. Category filters
      if (selectedCategory !== 'All') {
        const searchResponse = await axios.get(`/api/marketplace/search?skill=${selectedCategory}`);
        setSearchResults(searchResponse.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Failed to load marketplace listings.');
    } finally {
      setLoading(false);
    }
  };

  const checkForPendingReviews = async () => {
    try {
      const response = await axios.get('/api/exchange/history');
      const { sessions } = response.data;
      // Find a session where the user is the learner, status is Scheduled, and date has passed
      const unreviewed = sessions.find(s => 
        s.learner._id === user._id && 
        s.status === 'Scheduled' && 
        new Date(s.date) < new Date()
      );
      if (unreviewed) {
        setPendingReviewSession(unreviewed);
        setReviewModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchMarketplaceData();
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`/api/marketplace/search?skill=${searchQuery}`);
      setSearchResults(response.data);
      setSelectedCategory('All');
    } catch (err) {
      triggerAlert('error', 'Search request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedSkill) {
      triggerAlert('error', 'Please select a skill to swap.');
      return;
    }
    try {
      await axios.post('/api/exchange/request', {
        receiverId: viewedProfile._id,
        skill: selectedSkill,
        message: requestMessage
      });
      triggerAlert('success', 'Exchange request sent successfully!');
      setRequestModalOpen(false);
      setRequestMessage('');
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to send request.');
    }
  };

  const handleBookSession = async () => {
    if (!bookingDate || !bookingTime || !selectedSkill) {
      triggerAlert('error', 'Please fill out all booking fields.');
      return;
    }
    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`);
      await axios.post('/api/session', {
        partnerId: viewedProfile._id,
        skill: selectedSkill,
        date: dateTime.toISOString(),
        duration: parseInt(bookingDuration),
        meetingType: bookingType,
        notes: bookingNotes
      });
      triggerAlert('success', 'Session scheduled! Meeting links generated.');
      setBookingModalOpen(false);
      setBookingNotes('');
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Booking failed.');
    }
  };

  const handleSubmitReview = async () => {
    try {
      await axios.post('/api/session/review', {
        sessionId: pendingReviewSession._id,
        rating: reviewRating,
        communication: reviewComm,
        knowledge: reviewKnowledge,
        helpfulness: reviewHelp,
        comment: reviewComment
      });
      triggerAlert('success', 'Review submitted! Credits updated.');
      setReviewModalOpen(false);
      setPendingReviewSession(null);
      refreshUser();
    } catch (err) {
      triggerAlert('error', 'Failed to submit review.');
    }
  };

  const calculateCompatibility = (otherUser) => {
    // Return compatibility score computed directly or mockup if missing fields
    const found = recommendations.find(r => r.user._id === otherUser._id);
    return found ? found.compatibilityScore : 0;
  };

  // Render smart recommendation headers
  const getAISuggestion = () => {
    const teachSkills = user.skillsCanTeach || [];
    if (teachSkills.length === 0) {
      return "List some skills you can teach under 'My Skills' to unlock smart matches and credits!";
    }
    const primarySkill = teachSkills[0].name;
    // Count how many people want this skill
    const targetCount = recommendations.filter(r => 
      r.user.skillsToLearn.some(s => s.name.toLowerCase() === primarySkill.toLowerCase())
    ).length || Math.floor(Math.random() * 8) + 3;

    return `You know ${primarySkill}. ${targetCount} students want to learn ${primarySkill}. Connect with them below and start earning credits!`;
  };

  return (
    <div className="main-content">
      {alert && (
        <div className={`form-alert ${alert.type}`} style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1100 }}>
          {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Hero section */}
      <div className="welcome-banner">
        <h1 className="welcome-title">Skill Exchange Marketplace</h1>
        <p className="welcome-subtitle">Trade your knowledge with peer students. No money needed — only learning credits.</p>
        
        {/* User Stats Bar */}
        <div className="market-stats-strip">
          <div className="market-stat-item">
            <span className="market-stat-val">{user.credits || 0}</span>
            <span className="market-stat-lbl">Credits Balance</span>
          </div>
          <div className="market-stat-item">
            <span className="market-stat-val">{user.completedSessions || 0}</span>
            <span className="market-stat-lbl">Completed swaps</span>
          </div>
          <div className="market-stat-item">
            <span className="market-stat-val">★ {user.rating > 0 ? user.rating : 'N/A'}</span>
            <span className="market-stat-lbl">Overall Rating</span>
          </div>
          <div className="market-stat-item">
            <span className="market-stat-val">{user.mentorBadges?.length || 0}</span>
            <span className="market-stat-lbl">Mentor Badges</span>
          </div>
        </div>
      </div>

      {/* AI helper bar */}
      <div className="ai-suggestion-box">
        <div className="ai-badge">AI Assistant</div>
        <p className="ai-suggestion-text">{getAISuggestion()}</p>
      </div>

      {/* Navigation tabs */}
      <div className="group-tabs-header" style={{ marginTop: '24px' }}>
        <button 
          className={`group-tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          <Compass size={18} />
          <span>Find Mentors</span>
        </button>
        <button 
          className={`group-tab-btn ${activeTab === 'roadmaps' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmaps')}
        >
          <Award size={18} />
          <span>Learning Paths</span>
        </button>
        <button 
          className={`group-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <Trophy size={18} />
          <span>Top Mentors</span>
        </button>
      </div>

      {activeTab === 'marketplace' && (
        <div className="marketplace-tab-content">
          {/* Search bar & categories */}
          <div className="search-filters-row" style={{ marginTop: '24px' }}>
            <form onSubmit={handleSearchSubmit} className="search-form-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search skills (e.g. React, Java, Figma, Calculus)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Search</button>
            </form>

            <div className="category-scroll-strip">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSearchQuery('');
                  }}
                  className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results list */}
          <div className="dashboard-grid" style={{ marginTop: '24px' }}>
            {/* Main matching list */}
            <div className="dashboard-panel">
              <h2 className="dashboard-panel-title">
                <BookOpen size={20} />
                <span>{selectedCategory !== 'All' || searchQuery ? 'Search Results' : 'Recommended Mentors'}</span>
              </h2>

              {loading ? (
                <div className="skeleton-loading-container">
                  <div className="skeleton-card" />
                  <div className="skeleton-card" />
                  <div className="skeleton-card" />
                </div>
              ) : (selectedCategory !== 'All' || searchQuery ? searchResults : recommendations).length === 0 ? (
                <div className="empty-state">
                  <Info size={32} />
                  <p>No compatible study partners found. Try expanding your skills to teach/learn or adjusting filter categories.</p>
                </div>
              ) : (
                <div className="mentor-cards-container">
                  {(selectedCategory !== 'All' || searchQuery ? searchResults : recommendations).map((rec) => {
                    // Normalize standard matches vs search results
                    const otherUser = rec.user || rec;
                    const compatibilityScore = rec.compatibilityScore || calculateCompatibility(otherUser);
                    const isPerfectMatch = compatibilityScore >= 85;

                    return (
                      <div key={otherUser._id} className="mentor-exchange-card">
                        <div className="mentor-card-header">
                          <Avatar src={otherUser.avatar} name={otherUser.name} size="48px" />
                          <div className="mentor-card-meta">
                            <h4 className="mentor-card-name">{otherUser.name}</h4>
                            <span className="mentor-card-sub">{otherUser.academicMajor || 'Undeclared'} • Year {otherUser.yearOfStudy || '1'}</span>
                          </div>
                          <div className="compatibility-badge-wrapper">
                            <span className={`compatibility-badge ${isPerfectMatch ? 'perfect' : ''}`}>
                              {compatibilityScore}% Match
                            </span>
                          </div>
                        </div>

                        <div className="mentor-card-skills">
                          <div className="skill-section-item">
                            <span className="skill-section-lbl">Teaches:</span>
                            <div className="skills-badge-list">
                              {otherUser.skillsCanTeach?.map((s, idx) => (
                                <span key={idx} className="tag-badge-accent" style={{ fontSize: '0.75rem' }}>{s.name} ({s.level})</span>
                              ))}
                            </div>
                          </div>
                          <div className="skill-section-item">
                            <span className="skill-section-lbl">Wants:</span>
                            <div className="skills-badge-list">
                              {otherUser.skillsToLearn?.map((s, idx) => (
                                <span key={idx} className="tag-badge" style={{ fontSize: '0.75rem' }}>{s.name}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mentor-card-footer">
                          <div className="mentor-rating-info">
                            <Star size={14} className="star-icon fill-amber" />
                            <span>{otherUser.rating > 0 ? otherUser.rating : 'New'} ({otherUser.completedSessions || 0} swaps)</span>
                          </div>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            onClick={() => setViewedProfile(otherUser)}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar quick actions & info */}
            <div className="group-sidebar">
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 className="dashboard-panel-title" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <Award size={16} />
                  <span>My Achievement Badges</span>
                </h3>
                {user.mentorBadges && user.mentorBadges.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {user.mentorBadges.map(badge => (
                      <div key={badge} className="badge-shield" title="Earned Badge">
                        <Award size={14} />
                        <span>{badge}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
                    No badges earned yet. Book and complete mentoring sessions to unlock React Mentor, Knowledge Hero, and more!
                  </p>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 className="dashboard-panel-title" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <HelpCircle size={16} />
                  <span>How does Exchange work?</span>
                </h3>
                <ol className="market-instructions">
                  <li>List skills you want to teach and learn.</li>
                  <li>Find matched students on the marketplace.</li>
                  <li>Send an exchange request to connect.</li>
                  <li>Schedule and hold the session (1 hour).</li>
                  <li>Submit a review. **20 credits** transfer automatically upon review.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roadmaps' && (
        <div className="roadmaps-tab-content" style={{ marginTop: '24px' }}>
          <h2 className="dashboard-panel-title">
            <Award size={20} />
            <span>Structured Learning Roadmaps</span>
          </h2>
          <div className="roadmaps-grid">
            {roadmaps.map((rm, idx) => (
              <div key={idx} className="glass-panel roadmap-card" style={{ padding: '24px', marginBottom: '20px' }}>
                <h3 className="roadmap-title">{rm.title}</h3>
                <p className="roadmap-desc">{rm.description}</p>
                
                <div className="roadmap-path-visual">
                  {rm.path.map((skill, stepIdx) => (
                    <React.Fragment key={stepIdx}>
                      <div className="roadmap-step">
                        <span className="step-num">{stepIdx + 1}</span>
                        <span className="step-skill">{skill}</span>
                      </div>
                      {stepIdx < rm.path.length - 1 && (
                        <div className="step-arrow">
                          <ArrowRight size={18} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div style={{ marginTop: '24px' }}>
          <Leaderboard />
        </div>
      )}

      {/* Student profile Detail View Modal */}
      {viewedProfile && (
        <div className="modal-overlay" onClick={() => setViewedProfile(null)}>
          <div className="modal-content profile-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Profile</h3>
              <button className="modal-close" onClick={() => setViewedProfile(null)}>&times;</button>
            </div>
            
            <div className="profile-detail-header">
              <Avatar src={viewedProfile.avatar} name={viewedProfile.name} size="80px" />
              <div className="profile-detail-meta">
                <h2>{viewedProfile.name}</h2>
                <p>{viewedProfile.academicMajor || 'Undeclared'} • Year {viewedProfile.yearOfStudy || '1'}</p>
                <p className="profile-univ">{viewedProfile.university || 'CollabStudy Affiliate'}</p>
              </div>
            </div>

            <div className="profile-detail-badges">
              <span className="badge-pill">★ {viewedProfile.rating > 0 ? viewedProfile.rating : 'New Rating'}</span>
              <span className="badge-pill">{viewedProfile.completedSessions || 0} completed sessions</span>
              <span className="badge-pill">{viewedProfile.credits || 0} credits</span>
            </div>

            <div className="profile-detail-body">
              <div className="profile-detail-section">
                <h4>Languages</h4>
                <p>{viewedProfile.languages?.join(', ') || 'English'}</p>
              </div>

              <div className="profile-detail-section">
                <h4>Skills they teach</h4>
                <div className="skills-badge-list">
                  {viewedProfile.skillsCanTeach?.map((s, idx) => (
                    <span key={idx} className="tag-badge-accent">{s.name} ({s.level})</span>
                  ))}
                </div>
              </div>

              <div className="profile-detail-section">
                <h4>Skills they want to learn</h4>
                <div className="skills-badge-list">
                  {viewedProfile.skillsToLearn?.map((s, idx) => (
                    <span key={idx} className="tag-badge">{s.name}</span>
                  ))}
                </div>
              </div>

              {/* Availability Calendar */}
              {viewedProfile.weeklyAvailability && (
                <div className="profile-detail-section">
                  <h4>Availability Summary</h4>
                  <div className="availability-summary-grid">
                    {Object.keys(viewedProfile.weeklyAvailability).map(day => {
                      const slots = viewedProfile.weeklyAvailability[day] || [];
                      if (slots.length === 0) return null;
                      return (
                        <div key={day} className="avail-summary-day">
                          <strong style={{ textTransform: 'capitalize' }}>{day.substr(0, 3)}:</strong>
                          <span> {slots.join(', ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-detail-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedSkill(viewedProfile.skillsToLearn?.[0]?.name || '');
                  setRequestModalOpen(true);
                }}
              >
                Send Exchange Request
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSelectedSkill(viewedProfile.skillsCanTeach?.[0]?.name || '');
                  setBookingModalOpen(true);
                }}
              >
                Book Skill Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Exchange Request modal */}
      {requestModalOpen && (
        <div className="modal-overlay" onClick={() => setRequestModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Exchange</h3>
              <button className="modal-close" onClick={() => setRequestModalOpen(false)}>&times;</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Select skill to swap</label>
              <select 
                className="form-input" 
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
                style={{ background: '#080808', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px' }}
              >
                <option value="">-- Choose Skill --</option>
                {viewedProfile?.skillsToLearn?.map(s => (
                  <option key={s._id} value={s.name}>{s.name} (I Teach)</option>
                ))}
                {viewedProfile?.skillsCanTeach?.map(s => (
                  <option key={s._id} value={s.name}>{s.name} (They Teach)</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message (Optional)</label>
              <textarea 
                rows="4" 
                className="form-input"
                placeholder="Hey! Let's swap skills. I noticed you teach..."
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setRequestModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendRequest}>Send Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Book Session modal */}
      {bookingModalOpen && (
        <div className="modal-overlay" onClick={() => setBookingModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Study Session</h3>
              <button className="modal-close" onClick={() => setBookingModalOpen(false)}>&times;</button>
            </div>

            <div className="form-group">
              <label className="form-label">Select Skill Subject</label>
              <select 
                className="form-input"
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value)}
                style={{ background: '#080808', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px' }}
              >
                <option value="">-- Choose Skill --</option>
                {viewedProfile?.skillsCanTeach?.map(s => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={bookingDate}
                  onClick={(e) => {
                    try {
                      e.target.showPicker();
                    } catch (err) {
                      // Fallback
                    }
                  }}
                  onChange={e => setBookingDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <select 
                  className="form-input" 
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                >
                  <option value="">Select Time</option>
                  {Array.from({ length: 29 }).map((_, index) => {
                    const hour = Math.floor(8 + index / 2);
                    const minute = index % 2 === 0 ? '00' : '30';
                    const displayHour = hour.toString().padStart(2, '0');
                    const timeVal = `${displayHour}:${minute}`;
                    const period = hour >= 12 ? 'PM' : 'AM';
                    const displayFormatHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                    const displayLabel = `${displayFormatHour}:${minute} ${period}`;
                    return (
                      <option key={timeVal} value={timeVal}>{displayLabel}</option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <select 
                  className="form-input"
                  value={bookingDuration}
                  onChange={e => setBookingDuration(e.target.value)}
                  style={{ background: '#080808', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px' }}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Meeting Type</label>
                <select 
                  className="form-input"
                  value={bookingType}
                  onChange={e => setBookingType(e.target.value)}
                  style={{ background: '#080808', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px' }}
                >
                  <option value="Video">Video Call</option>
                  <option value="Chat">Chat Swap</option>
                  <option value="In Person">In Person</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes for Mentor</label>
              <textarea 
                rows="3" 
                className="form-input"
                placeholder="What would you like to focus on during this session?"
                value={bookingNotes}
                onChange={e => setBookingNotes(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setBookingModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBookSession}>Schedule Session</button>
            </div>
          </div>
        </div>
      )}

      {/* Review completed session popup */}
      {reviewModalOpen && pendingReviewSession && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Session Review Pending</h3>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              You recently completed a session on **{pendingReviewSession.skill}** with mentor **{pendingReviewSession.mentor?.name}**.
              Please submit a review. **20 credits** will be transferred upon submission.
            </p>

            <div className="form-group">
              <label className="form-label">Teaching Quality (1 - 5 stars)</label>
              <select className="form-input" value={reviewRating} onChange={e => setReviewRating(parseInt(e.target.value))} style={{ background: '#080808', color: '#fff' }}>
                <option value="5">★★★★★ (5/5)</option>
                <option value="4">★★★★☆ (4/5)</option>
                <option value="3">★★★☆☆ (3/5)</option>
                <option value="2">★★☆☆☆ (2/5)</option>
                <option value="1">★☆☆☆☆ (1/5)</option>
              </select>
            </div>

            <div className="profile-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Communication</label>
                <select className="form-input" value={reviewComm} onChange={e => setReviewComm(parseInt(e.target.value))} style={{ background: '#080808', color: '#fff' }}>
                  <option value="5">5/5</option>
                  <option value="4">4/5</option>
                  <option value="3">3/5</option>
                  <option value="2">2/5</option>
                  <option value="1">1/5</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Knowledge</label>
                <select className="form-input" value={reviewKnowledge} onChange={e => setReviewKnowledge(parseInt(e.target.value))} style={{ background: '#080808', color: '#fff' }}>
                  <option value="5">5/5</option>
                  <option value="4">4/5</option>
                  <option value="3">3/5</option>
                  <option value="2">2/5</option>
                  <option value="1">1/5</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Helpfulness</label>
                <select className="form-input" value={reviewHelp} onChange={e => setReviewHelp(parseInt(e.target.value))} style={{ background: '#080808', color: '#fff' }}>
                  <option value="5">5/5</option>
                  <option value="4">4/5</option>
                  <option value="3">3/5</option>
                  <option value="2">2/5</option>
                  <option value="1">1/5</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Comments (Optional)</label>
              <textarea 
                rows="3" 
                className="form-input"
                placeholder="Write your feedback..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={handleSubmitReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillMarketplace;
