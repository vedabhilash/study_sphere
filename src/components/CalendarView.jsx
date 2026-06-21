import React from 'react';
import { Calendar as CalendarIcon, Clock, Users, Plus, AlertTriangle, CheckCircle2, UserX } from 'lucide-react';
import { DAYS, TIME_SLOTS } from '../data/mockData';

export default function CalendarView({ group, currentStudent, allStudents, onScheduleMeeting }) {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newMeeting, setNewMeeting] = React.useState({
    title: '',
    day: 'Monday',
    time: TIME_SLOTS[2], // Default Evening
    duration: 60
  });

  // Get profiles of all group members
  const memberProfiles = React.useMemo(() => {
    return group.members.map(id => {
      return allStudents.find(s => s.id === id) || null;
    }).filter(Boolean);
  }, [group.members, allStudents]);

  // Calculate conflicts for a proposed day and slot
  const checkConflicts = React.useCallback((day, timeSlot) => {
    const busyMembers = [];
    const availableMembers = [];
    
    memberProfiles.forEach(member => {
      const avail = member.availability || {};
      const daySlots = avail[day] || [];
      if (daySlots.includes(timeSlot)) {
        availableMembers.push(member);
      } else {
        busyMembers.push(member);
      }
    });

    return {
      isConflict: busyMembers.length > 0,
      busyMembers,
      availableMembers
    };
  }, [memberProfiles]);

  // Current proposed slot conflict report
  const conflictReport = React.useMemo(() => {
    return checkConflicts(newMeeting.day, newMeeting.time);
  }, [newMeeting.day, newMeeting.time, checkConflicts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMeeting.title.trim()) return;

    // Create meeting
    const meetingDate = new Date();
    // Simple mock date generation based on day of week chosen
    const dayOfWeekMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const targetDay = dayOfWeekMap[newMeeting.day];
    const currentDay = meetingDate.getDay();
    let distance = targetDay - currentDay;
    if (distance <= 0) distance += 7; // Next week
    meetingDate.setDate(meetingDate.getDate() + distance);

    const dateStr = meetingDate.toISOString().split('T')[0];

    const meeting = {
      id: `meet-${Date.now()}`,
      title: newMeeting.title,
      date: dateStr,
      time: `${newMeeting.day} - ${newMeeting.time}`,
      duration: parseInt(newMeeting.duration),
      location: 'Virtual Room',
      attendees: memberProfiles.map(m => m.id)
    };

    onScheduleMeeting(group.id, meeting);
    setShowAddModal(false);
    setNewMeeting({
      title: '',
      day: 'Monday',
      time: TIME_SLOTS[2],
      duration: 60
    });
  };

  return (
    <div className="calendar-layout">
      {/* Left Column: Scheduled sessions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3>Scheduled Study Sessions</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <Plus size={14} />
            <span>Schedule Session</span>
          </button>
        </div>

        {group.meetings.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CalendarIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No meetings scheduled. Click "Schedule Session" to plan one.</p>
          </div>
        ) : (
          <div className="meeting-list">
            {group.meetings.map(meet => {
              // Calculate compatibility for this meeting's day and slot if it is parsed
              // Format is "Day - Slot"
              let meetDay = 'Monday';
              let meetSlot = TIME_SLOTS[2];
              if (meet.time.includes(' - ')) {
                const parts = meet.time.split(' - ');
                meetDay = parts[0];
                meetSlot = parts[1];
              }
              const report = checkConflicts(meetDay, meetSlot);
              
              return (
                <div key={meet.id} className="meeting-card">
                  <div className="meeting-info">
                    <h4>{meet.title}</h4>
                    <div className="meeting-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CalendarIcon size={12} />
                        {meet.date} ({meetDay})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {meetSlot} ({meet.duration} min)
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    {report.isConflict ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        <AlertTriangle size={10} style={{ marginRight: '2px' }} />
                        {report.busyMembers.length} Conflict(s)
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={10} style={{ marginRight: '2px' }} />
                        Conflict-Free
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Location: <strong>{meet.location}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group Availability Heatmap/Matrix */}
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Group Availability Map</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            A summary of which times overlap best for all members currently in the group. Green slots are perfect; orange slots indicate partial conflicts.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <div style={{ width: '80px' }}>Day</div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem', textAlign: 'center' }}>
                {TIME_SLOTS.map(t => <div key={t}>{t.split(' ')[0]}</div>)}
              </div>
            </div>

            {DAYS.map(day => (
              <div key={day} className="grid-day-row">
                <span className="grid-day-name">{day.substring(0, 3)}</span>
                <div className="grid-day-slots">
                  {TIME_SLOTS.map(slot => {
                    const report = checkConflicts(day, slot);
                    const totalMembers = memberProfiles.length;
                    const availCount = report.availableMembers.length;
                    
                    let bgClass = 'busy';
                    let text = 'Conflict';
                    let colorStyle = {};
                    
                    if (availCount === totalMembers && totalMembers > 0) {
                      bgClass = 'available';
                      text = '100% Free';
                    } else if (availCount > 0) {
                      text = `${availCount}/${totalMembers} Free`;
                      colorStyle = { 
                        background: 'rgba(245, 158, 11, 0.12)', 
                        color: 'var(--warning)', 
                        border: '1px solid rgba(245, 158, 11, 0.2)' 
                      };
                    } else {
                      text = '0% Free';
                      colorStyle = {
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      };
                    }

                    return (
                      <div 
                        key={slot} 
                        className={`grid-slot-indicator ${bgClass === 'available' ? 'available' : ''}`}
                        style={bgClass === 'available' ? {} : colorStyle}
                        title={report.busyMembers.length > 0 ? `Busy: ${report.busyMembers.map(m => m.name).join(', ')}` : 'Everyone is free!'}
                      >
                        {text}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Conflict Inspector & Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-card" style={{ height: '100%' }}>
          <h3>Scheduler Quick Check</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Check real-time compatibility for proposed times before adding meetings.
          </p>

          <div className="form-group">
            <label className="form-label">Day</label>
            <select 
              value={newMeeting.day} 
              onChange={(e) => setNewMeeting(prev => ({ ...prev, day: e.target.value }))}
              className="form-select"
            >
              {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Time Slot</label>
            <select 
              value={newMeeting.time} 
              onChange={(e) => setNewMeeting(prev => ({ ...prev, time: e.target.value }))}
              className="form-select"
            >
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
            <span className="form-label" style={{ marginBottom: '0.75rem' }}>Conflict Status</span>
            
            {conflictReport.isConflict ? (
              <div className="conflict-warning-box" style={{ margin: 0 }}>
                <AlertTriangle size={18} />
                <div className="conflict-warning-text">
                  <h5>Schedule Conflict Detected</h5>
                  <p style={{ marginBottom: '0.5rem' }}>
                    The following members are <strong>busy</strong> at this time:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {conflictReport.busyMembers.map(m => (
                      <span key={m.id} className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        <UserX size={10} style={{ marginRight: '2px' }} />
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '1rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center'
                }}
              >
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <div>
                  <h5 style={{ color: '#5cd5a3', fontSize: '0.9rem', fontWeight: 600 }}>100% Conflict-Free</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>All group members are free!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Propose Meeting Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSubmit} className="modal-content">
            <div className="modal-header">
              <h3>Schedule Study Session</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Session Topic / Title</label>
              <input 
                type="text" 
                placeholder="e.g. Chapter 7 Integration Homework" 
                value={newMeeting.title}
                onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                className="form-input"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Day</label>
                <select 
                  value={newMeeting.day} 
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, day: e.target.value }))}
                  className="form-select"
                >
                  {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Time Slot</label>
                <select 
                  value={newMeeting.time} 
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, time: e.target.value }))}
                  className="form-select"
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <select 
                value={newMeeting.duration} 
                onChange={(e) => setNewMeeting(prev => ({ ...prev, duration: e.target.value }))}
                className="form-select"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            <div style={{ margin: '1rem 0' }}>
              {conflictReport.isConflict ? (
                <div className="conflict-warning-box" style={{ margin: 0 }}>
                  <AlertTriangle size={18} />
                  <div className="conflict-warning-text">
                    <h5>Scheduling Conflict Alert</h5>
                    <p>
                      <strong>{conflictReport.busyMembers.map(m => m.name).join(', ')}</strong> {conflictReport.busyMembers.length > 1 ? 'are' : 'is'} not free at this time.
                    </p>
                  </div>
                </div>
              ) : (
                <div 
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    border: '1px solid rgba(16, 185, 129, 0.2)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '0.75rem',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}
                >
                  <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.8rem', color: '#5cd5a3', fontWeight: 600 }}>Everyone is available!</span>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <span>Confirm & Schedule</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
