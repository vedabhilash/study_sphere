import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Check, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './Profile.css';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const slots = ['Morning', 'Afternoon', 'Evening'];

const WeeklyAvailability = () => {
  const { user, refreshUser } = useAuth();

  // Availability object: e.g. { "Monday-Morning": true, "Tuesday-Evening": true }
  const [availability, setAvailability] = useState({});
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (user && user.weeklyAvailability) {
      setAvailability(user.weeklyAvailability);
    }
  }, [user]);

  const toggleSlot = (day, slot) => {
    const key = `${day}-${slot}`;
    setAvailability(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      await axios.put('/api/auth/profile', {
        weeklyAvailability: availability,
      });
      await refreshUser();
      setAlert({ type: 'success', message: 'Availability updated successfully!' });
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update availability.' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/" className="breadcrumb-link">Home</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-link">Profile</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Weekly Availability</span>
      </div>

      {/* Header */}
      <div className="profile-page-header">
        <h1 className="profile-page-title">Weekly Availability</h1>
        <p className="profile-page-subtitle">Choose when you're available for study sessions.</p>
      </div>

      {/* Card */}
      <div className="profile-card">
        {alert && (
          <div className={`form-alert ${alert.type}`}>
            {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="availability-table-container">
          <table className="availability-matrix">
            <thead>
              <tr>
                <th>Day</th>
                <th>Morning</th>
                <th>Afternoon</th>
                <th>Evening</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day}>
                  <td>{day}</td>
                  {slots.map((slot) => {
                    const key = `${day}-${slot}`;
                    const isSelected = !!availability[key];
                    return (
                      <td key={slot} style={{ padding: 0 }}>
                        <button
                          type="button"
                          className={`availability-cell-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleSlot(day, slot)}
                          aria-label={`Toggle availability for ${day} ${slot}`}
                        >
                          {isSelected && <Check size={18} strokeWidth={3} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Footer */}
        <div className="profile-actions-footer">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader className="animate-spin" size={16} />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Availability</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyAvailability;
