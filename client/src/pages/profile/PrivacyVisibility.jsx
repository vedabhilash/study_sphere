import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './Profile.css';

const PrivacyVisibility = () => {
  const { user, refreshUser } = useAuth();

  const [privacy, setPrivacy] = useState({
    showProfileMatchFinder: true,
    shareScheduleStudyPartners: true,
    allowStudyInvitations: true,
    showOnlineStatus: true,
    receiveNotifications: true
  });
  
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (user && user.privacy) {
      setPrivacy({
        showProfileMatchFinder: user.privacy.showProfileMatchFinder !== undefined ? user.privacy.showProfileMatchFinder : true,
        shareScheduleStudyPartners: user.privacy.shareScheduleStudyPartners !== undefined ? user.privacy.shareScheduleStudyPartners : true,
        allowStudyInvitations: user.privacy.allowStudyInvitations !== undefined ? user.privacy.allowStudyInvitations : true,
        showOnlineStatus: user.privacy.showOnlineStatus !== undefined ? user.privacy.showOnlineStatus : true,
        receiveNotifications: user.privacy.receiveNotifications !== undefined ? user.privacy.receiveNotifications : true
      });
    }
  }, [user]);

  const handleToggle = (key) => {
    setPrivacy(prev => ({
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
        privacy
      });
      await refreshUser();
      setAlert({ type: 'success', message: 'Privacy settings updated successfully!' });
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update privacy settings.' 
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
        <span className="breadcrumb-current">Privacy & Visibility</span>
      </div>

      {/* Header */}
      <div className="profile-page-header">
        <h1 className="profile-page-title">Privacy & Visibility</h1>
        <p className="profile-page-subtitle">Control who can see your profile and schedule.</p>
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
          <div className="privacy-switches-list">
            
            {/* Switch 1: Show profile in Match Finder */}
            <div className="switch-container">
              <div className="switch-info">
                <span className="switch-title">Show profile in Match Finder</span>
                <span className="switch-description">Allow other students to find you based on similar courses and availability.</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={privacy.showProfileMatchFinder} 
                  onChange={() => handleToggle('showProfileMatchFinder')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Switch 2: Share schedule with study partners */}
            <div className="switch-container">
              <div className="switch-info">
                <span className="switch-title">Share schedule with study partners</span>
                <span className="switch-description">Enable study partners to view your weekly availability grid.</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={privacy.shareScheduleStudyPartners} 
                  onChange={() => handleToggle('shareScheduleStudyPartners')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Switch 3: Allow study invitations */}
            <div className="switch-container">
              <div className="switch-info">
                <span className="switch-title">Allow study invitations</span>
                <span className="switch-description">Receive invitations to join study groups and sessions directly.</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={privacy.allowStudyInvitations} 
                  onChange={() => handleToggle('allowStudyInvitations')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Switch 4: Show online status */}
            <div className="switch-container">
              <div className="switch-info">
                <span className="switch-title">Show online status</span>
                <span className="switch-description">Let others see when you are active on StudySphere.</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={privacy.showOnlineStatus} 
                  onChange={() => handleToggle('showOnlineStatus')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Switch 5: Receive notifications */}
            <div className="switch-container">
              <div className="switch-info">
                <span className="switch-title">Receive notifications</span>
                <span className="switch-description">Get system notifications for session updates and messages.</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={privacy.receiveNotifications} 
                  onChange={() => handleToggle('receiveNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
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
                <span>Save Privacy Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrivacyVisibility;
