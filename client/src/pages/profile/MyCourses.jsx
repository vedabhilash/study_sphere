import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Check, Plus, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './Profile.css';

const defaultCourses = ['CS101', 'MATH201', 'PHYS102', 'CHEM101', 'BIO202', 'HIST201', 'LIT105'];

const MyCourses = () => {
  const { user, refreshUser } = useAuth();

  const [availableCourses, setAvailableCourses] = useState(defaultCourses);
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  const [customCourseInput, setCustomCourseInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (user && user.courses) {
      setSelectedCourses(user.courses);
      
      // Merge user's saved courses that aren't in default list into the available list
      const custom = user.courses.filter(course => !defaultCourses.includes(course));
      if (custom.length > 0) {
        // Remove duplicates
        const merged = Array.from(new Set([...defaultCourses, ...custom]));
        setAvailableCourses(merged);
      }
    }
  }, [user]);

  const toggleCourse = (course) => {
    if (selectedCourses.includes(course)) {
      setSelectedCourses(selectedCourses.filter(c => c !== course));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const handleAddCustomCourse = (e) => {
    e.preventDefault();
    const cleanCourse = customCourseInput.trim().toUpperCase();
    
    if (!cleanCourse) return;
    
    if (!availableCourses.includes(cleanCourse)) {
      setAvailableCourses([...availableCourses, cleanCourse]);
    }
    
    if (!selectedCourses.includes(cleanCourse)) {
      setSelectedCourses([...selectedCourses, cleanCourse]);
    }
    
    setCustomCourseInput('');
    setShowCustomInput(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      await axios.put('/api/auth/profile', {
        courses: selectedCourses,
      });
      await refreshUser();
      setAlert({ type: 'success', message: 'Courses updated successfully!' });
    } catch (err) {
      console.error(err);
      setAlert({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update courses.' 
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
        <span className="breadcrumb-current">My Courses</span>
      </div>

      {/* Header */}
      <div className="profile-page-header">
        <h1 className="profile-page-title">My Courses</h1>
        <p className="profile-page-subtitle">Select the courses you are currently enrolled in.</p>
      </div>

      {/* Card */}
      <div className="profile-card">
        {alert && (
          <div className={`form-alert ${alert.type}`}>
            {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="courses-selection-wrapper">
          <div className="courses-grid">
            {availableCourses.map((course) => {
              const isSelected = selectedCourses.includes(course);
              return (
                <div 
                  key={course} 
                  className={`course-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleCourse(course)}
                >
                  <span className="course-name">{course}</span>
                  {isSelected && (
                    <span className="course-checkmark">
                      <Check size={16} strokeWidth={3} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Custom Course trigger / input */}
          {!showCustomInput ? (
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setShowCustomInput(true)}
            >
              <Plus size={16} />
              <span>Add Custom Course</span>
            </button>
          ) : (
            <form onSubmit={handleAddCustomCourse} className="add-custom-course-wrapper animate-fade-in">
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. CS250, MATH302"
                value={customCourseInput}
                onChange={(e) => setCustomCourseInput(e.target.value)}
                autoFocus
                required
              />
              <button type="submit" className="btn btn-primary">Add</button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setCustomCourseInput('');
                  setShowCustomInput(false);
                }}
              >
                Cancel
              </button>
            </form>
          )}
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
              <span>Save Courses</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
