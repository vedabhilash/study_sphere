import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import { 
  Users, Check, X, Clock, Calendar, HelpCircle, BookOpen, AlertCircle, Video, FileText, CheckCircle 
} from 'lucide-react';
import { skillsAPI } from '../utils/apiService';
import './SkillMarketplace.css';

const ExchangeRequests = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [activeSegment, setActiveSegment] = useState('pending'); // 'pending' | 'accepted' | 'completed' | 'rejected'
  
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Booking Modal States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState('60');
  const [bookingType, setBookingType] = useState('Video');
  const [bookingNotes, setBookingNotes] = useState('');

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  // Handle real-time socket updates without page refreshes
  useEffect(() => {
    if (!socket) return;

    const handleReceived = (newRequest) => {
      setRequests((prev) => {
        const exists = prev.some((r) => r._id === newRequest._id);
        if (exists) {
          return prev.map((r) => r._id === newRequest._id ? newRequest : r);
        }
        return [newRequest, ...prev];
      });
    };

    const handleAccepted = (updatedRequest) => {
      setRequests((prev) =>
        prev.map((r) => (r._id === updatedRequest._id ? { ...r, status: 'Accepted' } : r))
      );
      fetchHistory();
    };

    const handleSessionBooked = (newSession) => {
      setSessions((prev) => {
        const exists = prev.some((s) => s._id === newSession._id);
        if (exists) return prev;
        return [newSession, ...prev];
      });
      fetchHistory();
    };

    const handleSessionCancelled = (cancelledSession) => {
      setSessions((prev) =>
        prev.map((s) => (s._id === cancelledSession._id ? { ...s, status: 'Cancelled' } : s))
      );
      fetchHistory();
    };

    socket.on('exchangeRequestReceived', handleReceived);
    socket.on('exchangeRequestAccepted', handleAccepted);
    socket.on('sessionBooked', handleSessionBooked);
    socket.on('sessionCancelled', handleSessionCancelled);

    return () => {
      socket.off('exchangeRequestReceived', handleReceived);
      socket.off('exchangeRequestAccepted', handleAccepted);
      socket.off('sessionBooked', handleSessionBooked);
      socket.off('sessionCancelled', handleSessionCancelled);
    };
  }, [socket]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await skillsAPI.getHistory();
      setRequests(data.requests || []);
      setSessions(data.sessions || []);
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to fetch request history.');
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleAccept = async (reqId) => {
    try {
      await skillsAPI.acceptRequest(reqId);
      triggerAlert('success', 'Exchange request accepted!');
      fetchHistory();
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to accept request.');
    }
  };

  const handleReject = async (reqId) => {
    try {
      await skillsAPI.rejectRequest(reqId);
      triggerAlert('success', 'Exchange request declined.');
      fetchHistory();
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to decline request.');
    }
  };

  const handleOpenBooking = (partner, skill) => {
    setSelectedPartner(partner);
    setSelectedSkill(skill);
    setBookingModalOpen(true);
  };

  const handleBookSession = async () => {
    if (!bookingDate || !bookingTime || !selectedPartner || !selectedSkill) {
      triggerAlert('error', 'Please fill out all booking fields.');
      return;
    }

    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`);
      
      // Validation: verify date is in the future
      if (dateTime <= new Date()) {
        triggerAlert('error', 'Session date and time must be in the future.');
        return;
      }

      await skillsAPI.bookSession({
        partnerId: selectedPartner._id,
        skill: selectedSkill,
        date: dateTime.toISOString(),
        duration: parseInt(bookingDuration),
        meetingType: bookingType,
        notes: bookingNotes
      });
      triggerAlert('success', 'Study session booked successfully!');
      setBookingModalOpen(false);
      setBookingNotes('');
      fetchHistory();
    } catch (err) {
      triggerAlert('error', err.message || 'Booking failed.');
    }
  };

  const getFilteredRequests = () => {
    switch (activeSegment) {
      case 'pending':
        return requests.filter(r => r.status === 'Pending');
      case 'accepted':
        return requests.filter(r => r.status === 'Accepted');
      case 'completed':
        return requests.filter(r => r.status === 'Completed');
      case 'rejected':
        return requests.filter(r => r.status === 'Rejected');
      default:
        return [];
    }
  };

  const getFilteredSessions = () => {
    if (activeSegment === 'accepted') {
      return sessions.filter(s => s.status === 'Scheduled');
    }
    if (activeSegment === 'completed') {
      return sessions.filter(s => s.status === 'Completed');
    }
    return [];
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', minHeight: '80vh', alignItems: 'center' }}>
        <Clock size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="main-content">
      {alert && (
        <div className={`form-alert ${alert.type}`} style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1100 }}>
          <AlertCircle size={16} />
          <span>{alert.message}</span>
        </div>
      )}

      <div className="welcome-banner">
        <h1 className="welcome-title">My Swap Requests</h1>
        <p className="welcome-subtitle">Manage connection proposals, accepted study sessions, and review history.</p>
      </div>

      {/* Segment tabs */}
      <div className="group-tabs-header" style={{ marginTop: '24px' }}>
        <button 
          className={`group-tab-btn ${activeSegment === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveSegment('pending')}
        >
          <Clock size={16} />
          <span>Pending Swaps</span>
        </button>
        <button 
          className={`group-tab-btn ${activeSegment === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveSegment('accepted')}
        >
          <Calendar size={16} />
          <span>Accepted & Scheduled</span>
        </button>
        <button 
          className={`group-tab-btn ${activeSegment === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveSegment('completed')}
        >
          <CheckCircle size={16} />
          <span>Completed Sessions</span>
        </button>
        <button 
          className={`group-tab-btn ${activeSegment === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveSegment('rejected')}
        >
          <X size={16} />
          <span>Declined Requests</span>
        </button>
      </div>

      {loading ? (
        <div className="skeleton-loading-container" style={{ marginTop: '24px' }}>
          <div className="skeleton-card" style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
          <div className="skeleton-card" style={{ height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ) : (
        <div className="requests-container" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Render Sessions first for Accepted / Completed segments */}
          {getFilteredSessions().map(session => {
            const isMentor = session.mentor?._id === user._id;
            const partner = isMentor ? session.learner : session.mentor;
            const partnerName = partner?.name || 'Deleted User';
            const partnerAvatar = partner?.avatar || '';
            const partnerMajor = partner?.academicMajor || 'Undeclared';

            return (
              <div key={session._id} className="mentor-exchange-card" style={{ borderLeft: '4px solid #ffffff' }}>
                <div className="mentor-card-header">
                  <Avatar src={partnerAvatar} name={partnerName} size="44px" />
                  <div className="mentor-card-meta">
                    <h4 className="mentor-card-name">
                      {isMentor ? `Teaching ${partnerName}` : `Learning from ${partnerName}`}
                    </h4>
                    <span className="mentor-card-sub">{partnerMajor}</span>
                  </div>
                  <div className="compatibility-badge-wrapper">
                    <span className="compatibility-badge perfect">
                      {session.meetingType} Session
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '14px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>Date: {new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <Clock size={14} />
                    <span>Time: {new Date(session.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({session.duration} minutes)</span>
                  </p>
                  {session.meetingLink && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <Video size={14} />
                      <a href={session.meetingLink} target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'underline' }}>
                        Join Virtual Room (Jitsi Meet)
                      </a>
                    </p>
                  )}
                  {session.notes && <p style={{ marginTop: '8px', fontStyle: 'italic' }}>Notes: {session.notes}</p>}
                </div>

                {activeSegment === 'completed' && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <Check size={14} className="text-success" />
                    <span>Rating Left: {session.rating ? `★ ${session.rating}` : 'No Review Submitted'}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Render Exchange connection requests */}
          {getFilteredRequests().map(req => {
            const isIncoming = req.receiver?._id === user._id;
            const partner = isIncoming ? req.sender : req.receiver;
            const partnerName = partner?.name || 'Deleted User';
            const partnerAvatar = partner?.avatar || '';
            const partnerMajor = partner?.academicMajor || 'Undeclared';

            return (
              <div key={req._id} className="mentor-exchange-card">
                <div className="mentor-card-header">
                  <Avatar src={partnerAvatar} name={partnerName} size="44px" />
                  <div className="mentor-card-meta">
                    <h4 className="mentor-card-name">
                      {isIncoming ? `Swap Request from ${partnerName}` : `Sent Swap Request to ${partnerName}`}
                    </h4>
                    <span className="mentor-card-sub">{partnerMajor}</span>
                  </div>
                  <div className="compatibility-badge-wrapper">
                    <span className="tag-badge">Subject: {req.skill}</span>
                  </div>
                </div>

                {req.message && (
                  <div style={{ background: '#080808', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', marginTop: '12px', fontSize: '0.9rem', color: '#fff' }}>
                    {req.message}
                  </div>
                )}

                {isIncoming && req.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleReject(req._id)}>
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleAccept(req._id)}>
                      <Check size={14} />
                      <span>Accept</span>
                    </button>
                  </div>
                )}

                {req.status === 'Accepted' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }} 
                      onClick={() => handleOpenBooking(partner, req.skill)}
                    >
                      <Calendar size={14} />
                      <span>Book Skill Session</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {getFilteredRequests().length === 0 && getFilteredSessions().length === 0 && (
            <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
              <Clock size={36} style={{ marginBottom: '12px' }} />
              <p>No transactions or schedules found in this category tab.</p>
            </div>
          )}

        </div>
      )}

      {/* Book Session modal */}
      {bookingModalOpen && selectedPartner && (
        <div className="modal-overlay" onClick={() => setBookingModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Study Session</h3>
              <button className="modal-close" onClick={() => setBookingModalOpen(false)}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Booking <strong>{selectedSkill}</strong> tutoring with <strong>{selectedPartner.name}</strong>.
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={bookingDate} 
                required
                onChange={e => setBookingDate(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input 
                type="time" 
                className="form-input" 
                value={bookingTime} 
                required
                onChange={e => setBookingTime(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <select 
                className="form-input" 
                value={bookingDuration} 
                onChange={e => setBookingDuration(e.target.value)}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
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
              >
                <option value="Video">Video Call (Studysphere Virtual Room)</option>
                <option value="In Person">In Person Meetup</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes / Learning Goals</label>
              <textarea 
                className="form-input" 
                placeholder="What topics do you want to cover? e.g., prepare for midterm, practice recursion..."
                style={{ minHeight: '80px' }}
                value={bookingNotes}
                onChange={e => setBookingNotes(e.target.value)}
              />
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setBookingModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBookSession}>Schedule Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeRequests;
