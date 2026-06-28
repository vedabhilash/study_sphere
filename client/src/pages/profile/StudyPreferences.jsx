import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './Profile.css';

const groupSizes = [
  { label: '2 Members', value: '2 Members' },
  { label: '4 Members', value: '4 Members' },
  { label: '6 Members', value: '6 Members' },
  { label: 'No Preference', value: 'No Preference' }
];

const studyStyles = [
  'Discussion Based',
  'Visual Learning',
  'Intensive Practice',
  'Quick Review'
];

const learningGoalsList = [
  'Prepare for Midterm',
  'Complete Assignments',
  'Project Collaboration',
  'Review Notes',
  'Practice Exams'
];

const StudyPreferences = () => {
  const { user, refreshUser } = useAuth();

  const [preferredGroupSize, setPreferredGroupSize] = useState('');
  const [preferredStudyStyle, setPreferredStudyStyle] = useState('');
  const [learningGoals, setLearningGoals] = useState([]);
  
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (user) {
      setPreferredGroupSize(user.preferredGroupSize || '');
      setPreferredStudyStyle(user.preferredStudyStyle || '');
      setLearningGoals(user.learningGoals || []);
    }
  }, [user]);

  const toggleGoal = (goal) => {
    if (learningGoals.includes(goal)) {
      setLearningGoals(learningGoals.filter(g => g !== goal));
    } else {
      setLearningGoals([...learningGoals, goal]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      await axios.put('/api/auth/profile', {
        preferredGroupSize,
        preferredStudyStyle,
        learningGoals
      });
      await refreshUser();
      setAlert({ type: 'success', message: 'Study preferences updated successfully!' });
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update study preferences.' 
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
        <span className="breadcrumb-current">Study Preferences</span>
      </div>

      {/* Header */}
      <div className="profile-page-header">
        <h1 className="profile-page-title">Study Preferences</h1>
        <p className="profile-page-subtitle">Customize how you prefer to study with others.</p>
      </div>

      {/* Card */}
      <div className="profile-card">
        {alert && (
          <div className={`form-alert ${alert.type}`}>
            {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="profile-form">
          
          {/* Section 1: Preferred Group Size */}
          <div className="preference-section">
            <h2 className="preference-section-title">Preferred Group Size</h2>
            <div className="profile-field-group" style={{ maxWidth: '300px' }}>
              <select 
                className="form-input"
                value={preferredGroupSize}
                onChange={(e) => setPreferredGroupSize(e.target.value)}
              >
                <option value="">Select Option</option>
                {groupSizes.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Preferred Study Style (Radio cards) */}
          <div className="preference-section">
            <h2 className="preference-section-title">Preferred Study Style</h2>
            <div className="preference-cards-grid">
              {studyStyles.map(style => {
                const isSelected = preferredStudyStyle === style;
                return (
                  <div 
                    key={style}
                    className={`preference-card radio ${isSelected ? 'selected' : ''}`}
                    onClick={() => setPreferredStudyStyle(style)}
                  >
                    <div className="preference-card-indicator">
                      {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }}></div>}
                    </div>
                    <span className="preference-card-text">{style}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Learning Goals (Checkbox cards) */}
          <div className="preference-section">
            <h2 className="preference-section-title">Learning Goals</h2>
            <div className="preference-cards-grid">
              {learningGoalsList.map(goal => {
                const isSelected = learningGoals.includes(goal);
                return (
                  <div 
                    key={goal}
                    className={`preference-card checkbox ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleGoal(goal)}
                  >
                    <div className="preference-card-indicator">
                      {isSelected && <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '1px' }}></div>}
                    </div>
                    <span className="preference-card-text">{goal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="profile-actions-footer">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StudyPreferences;
