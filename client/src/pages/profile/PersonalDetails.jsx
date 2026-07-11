import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Avatar from '../../components/Avatar';
import './Profile.css';

const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${import.meta.env.VITE_API_URL || ''}${url}`;
};

const PersonalDetails = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [academicMajor, setAcademicMajor] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAcademicMajor(user.academicMajor || '');
      setYearOfStudy(user.yearOfStudy || '');
      setUniversity(user.university || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'Full name is required.' });
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      await axios.put('/api/auth/profile', {
        name,
        academicMajor,
        yearOfStudy,
        university,
        bio,
      });
      await refreshUser();
      setAlert({ type: 'success', message: 'Personal details updated successfully!' });
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update personal details.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    setAlert(null);

    try {
      await axios.post('/api/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await refreshUser();
      setAlert({ type: 'success', message: 'Avatar uploaded successfully!' });
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to upload avatar. Ensure it is a valid image.' 
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="profile-container animate-fade-in">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/" className="breadcrumb-link">Home</Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-link">Profile</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Personal Details</span>
      </div>

      {/* Header */}
      <div className="profile-page-header">
        <h1 className="profile-page-title">Personal Details</h1>
        <p className="profile-page-subtitle">Manage your personal and academic information.</p>
      </div>

      {/* Content Card */}
      <div className="profile-card">
        {/* Alert Notifications */}
        {alert && (
          <div className={`form-alert ${alert.type}`}>
            {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-preview-container">
            <Avatar src={user?.avatar} name={name || user?.name || 'User'} size="100%" style={{ border: 'none', boxShadow: 'none' }} />
          </div>

          <div className="avatar-upload-wrapper">
            <label className="avatar-upload-btn-label">
              {uploading ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Upload size={16} />
              )}
              <span>Upload Avatar</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
            <span className="avatar-upload-info">JPG, PNG or GIF. Max size of 10MB.</span>
          </div>
        </div>

        {/* Main Details Form */}
        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-form-grid">
            <div className="profile-field-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input 
                type="text" 
                id="fullName" 
                className="form-input" 
                placeholder="Your full name"
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="profile-field-group">
              <label className="form-label" htmlFor="emailAddress">Email (Read Only)</label>
              <input 
                type="email" 
                id="emailAddress" 
                className="form-input" 
                value={user?.email || ''} 
                readOnly 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div className="profile-field-group">
              <label className="form-label" htmlFor="major">Academic Major</label>
              <input 
                type="text" 
                id="major" 
                className="form-input" 
                placeholder="e.g. Computer Science"
                value={academicMajor} 
                onChange={(e) => setAcademicMajor(e.target.value)}
              />
            </div>

            <div className="profile-field-group">
              <label className="form-label" htmlFor="yearOfStudy">Year of Study</label>
              <select 
                id="yearOfStudy" 
                className="form-input"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
              >
                <option value="">Select Year</option>
                <option value="Freshman / 1st Year">Freshman / 1st Year</option>
                <option value="Sophomore / 2nd Year">Sophomore / 2nd Year</option>
                <option value="Junior / 3rd Year">Junior / 3rd Year</option>
                <option value="Senior / 4th Year">Senior / 4th Year</option>
                <option value="Graduate / Master's">Graduate / Master's</option>
                <option value="PhD Candidate">PhD Candidate</option>
              </select>
            </div>

            <div className="profile-field-group" style={{ gridColumn: 'span 1' }}>
              <label className="form-label" htmlFor="university">University</label>
              <input 
                type="text" 
                id="university" 
                className="form-input" 
                placeholder="e.g. Stanford University"
                value={university} 
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-field-group">
            <label className="form-label" htmlFor="shortBio">Short Bio</label>
            <textarea 
              id="shortBio" 
              className="form-input" 
              rows="4" 
              placeholder="Tell us a little about your studies, interest, and goals..."
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              style={{ resize: 'vertical' }}
            />
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
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalDetails;
