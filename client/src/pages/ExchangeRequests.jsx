import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { 
  Users, Check, X, Clock, Calendar, HelpCircle, BookOpen, AlertCircle, Video, FileText 
} from 'lucide-react';
import './SkillMarketplace.css';

const ExchangeRequests = () => {
  const { user } = useAuth();
  const [activeSegment, setActiveSegment] = useState('pending'); // 'pending' | 'accepted' | 'completed' | 'rejected'
  
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/exchange/history');
      setRequests(response.data.requests);
      setSessions(response.data.sessions);
    } catch (err) {
      triggerAlert('error', 'Failed to fetch request history.');
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
      await axios.put(`/api/exchange/request/${reqId}/accept`);
      triggerAlert('success', 'Exchange request accepted!');
      fetchHistory();
    } catch (err) {
      triggerAlert('error', 'Failed to accept request.');
    }
  };

  const handleReject = async (reqId) => {
    try {
      await axios.put(`/api/exchange/request/${reqId}/reject`);
      triggerAlert('success', 'Exchange request declined.');
      fetchHistory();
    } catch (err) {
      triggerAlert('error', 'Failed to decline request.');
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
          <span>Completed sessions</span>
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
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : (
        <div className="requests-container" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Render Sessions first for Accepted / Completed segments */}
          {getFilteredSessions().map(session => {
            const isMentor = session.mentor?._id === user._id;
            const partner = isMentor ? session.learner : session.mentor;

            return (
              <div key={session._id} className="mentor-exchange-card" style={{ borderLeft: '4px solid #ffffff' }}>
                <div className="mentor-card-header">
                  <Avatar src={partner.avatar} name={partner.name} size="44px" />
                  <div className="mentor-card-meta">
                    <h4 className="mentor-card-name">
                      {isMentor ? `Teaching ${partner.name}` : `Learning from ${partner.name}`}
                    </h4>
                    <span className="mentor-card-sub">{partner.academicMajor || 'Undeclared'}</span>
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

            return (
              <div key={req._id} className="mentor-exchange-card">
                <div className="mentor-card-header">
                  <Avatar src={partner.avatar} name={partner.name} size="44px" />
                  <div className="mentor-card-meta">
                    <h4 className="mentor-card-name">
                      {isIncoming ? `Swap Request from ${partner.name}` : `Sent Swap Request to ${partner.name}`}
                    </h4>
                    <span className="mentor-card-sub">{partner.academicMajor || 'Undeclared'}</span>
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
              </div>
            );
          })}

          {getFilteredRequests().length === 0 && getFilteredSessions().length === 0 && (
            <div className="empty-state">
              <Clock size={32} />
              <p>No transactions or schedules found in this category tab.</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ExchangeRequests;
