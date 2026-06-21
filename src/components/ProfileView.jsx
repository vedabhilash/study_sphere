import React from 'react';
import { Save, AlertCircle, Calendar } from 'lucide-react';
import { COURSES, STUDY_STYLES, GOALS, TIME_SLOTS, DAYS } from '../data/mockData';

export default function ProfileView({ studentProfile, onSave }) {
  const [profile, setProfile] = React.useState({ ...studentProfile });
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    setProfile({ ...studentProfile });
  }, [studentProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrivacyChange = (e) => {
    const { name, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [name]: checked
      }
    }));
  };

  const toggleCourse = (course) => {
    setProfile(prev => {
      const courses = prev.courses || [];
      if (courses.includes(course)) {
        return { ...prev, courses: courses.filter(c => c !== course) };
      } else {
        return { ...prev, courses: [...courses, course] };
      }
    });
  };

  const toggleGoal = (goal) => {
    setProfile(prev => {
      const goals = prev.learningGoals || [];
      if (goals.includes(goal)) {
        return { ...prev, learningGoals: goals.filter(g => g !== goal) };
      } else {
        return { ...prev, learningGoals: [...goals, goal] };
      }
    });
  };

  const toggleAvailability = (day, slot) => {
    setProfile(prev => {
      const currentAvail = prev.availability || {};
      const daySlots = currentAvail[day] || [];
      
      let newDaySlots;
      if (daySlots.includes(slot)) {
        newDaySlots = daySlots.filter(s => s !== slot);
      } else {
        newDaySlots = [...daySlots, slot];
      }
      
      return {
        ...prev,
        availability: {
          ...currentAvail,
          [day]: newDaySlots
        }
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(profile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>My Profile</h1>
          <p>Set up your academic details, preferences, and weekly availability to matching with the best study partners.</p>
        </div>
        {saveSuccess && (
          <div className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Profile saved successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="profile-grid">
        {/* Left Column: Personal details */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3>Personal Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
            <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
              {profile.avatar}
            </div>
            <div className="form-group" style={{ width: '100%' }}>
              <label className="form-label">Avatar Initials</label>
              <input 
                type="text" 
                name="avatar" 
                maxLength="2"
                value={profile.avatar || ''} 
                onChange={handleChange}
                className="form-input" 
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={profile.name || ''} 
              onChange={handleChange}
              className="form-input" 
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Academic Major</label>
            <input 
              type="text" 
              name="major" 
              value={profile.major || ''} 
              onChange={handleChange}
              className="form-input" 
              placeholder="e.g. Computer Science"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Bio</label>
            <textarea 
              name="bio" 
              value={profile.bio || ''} 
              onChange={handleChange}
              className="form-textarea" 
              rows="3"
              placeholder="Tell other students about your study goals..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Privacy & Visibility</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  name="visibility" 
                  checked={profile.privacy?.visibility === 'public'} 
                  onChange={(e) => {
                    setProfile(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, visibility: e.target.checked ? 'public' : 'private' }
                    }));
                  }}
                />
                Show profile in Match Finder
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  name="showSchedule" 
                  checked={profile.privacy?.showSchedule !== false} 
                  onChange={handlePrivacyChange}
                />
                Share schedule with group members
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            <Save size={16} />
            <span>Save Profile</span>
          </button>
        </div>

        {/* Right Column: Preferences & Availability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Enrolled Courses */}
          <div className="glass-card">
            <h3>My Courses</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Select the courses you are currently taking. We use these to suggest study partners.
            </p>
            <div className="courses-checkbox-grid">
              {COURSES.map(course => {
                const isSelected = (profile.courses || []).includes(course);
                return (
                  <div 
                    key={course}
                    onClick={() => toggleCourse(course)}
                    className={`checkbox-card ${isSelected ? 'selected' : ''}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      style={{ pointerEvents: 'none' }}
                    />
                    <span style={{ fontSize: '0.85rem' }}>{course}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferences */}
          <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <h3>Study Preferences</h3>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Preferred Group Size</label>
                <select 
                  name="groupSizePreference" 
                  value={profile.groupSizePreference || 4} 
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value={2}>1-on-1 Study Partner (2 members)</option>
                  <option value={3}>Small Group (3 members)</option>
                  <option value={4}>Standard Group (4 members)</option>
                  <option value={5}>Large Group (5 members)</option>
                  <option value={6}>Collaborative Pod (6 members)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Study Style</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {STUDY_STYLES.map(style => (
                    <label 
                      key={style.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.5rem', 
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: '0.4rem',
                        borderRadius: '4px',
                        background: profile.studyStyle === style.id ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="studyStyle" 
                        value={style.id}
                        checked={profile.studyStyle === style.id}
                        onChange={handleChange}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <div>
                        <strong>{style.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{style.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3>Learning Goals</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Select what you want to achieve with your study groups.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {GOALS.map(goal => {
                  const isSelected = (profile.learningGoals || []).includes(goal);
                  return (
                    <div 
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`checkbox-card ${isSelected ? 'selected' : ''}`}
                      style={{ padding: '0.6rem 0.8rem' }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        readOnly
                        style={{ pointerEvents: 'none' }}
                      />
                      <span style={{ fontSize: '0.8rem' }}>{goal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Availability Grid */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Calendar size={18} className="text-primary" />
              <h3 style={{ margin: 0 }}>Weekly Availability</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Click to select the times you are free to meet. This allows the platform to calculate scheduling overlap and check for conflicts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="availability-selector" style={{ marginBottom: '0.25rem' }}>
                <div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {TIME_SLOTS.map(t => <div key={t}>{t.split(' ')[0]}</div>)}
                </div>
              </div>

              {DAYS.map(day => {
                const daySlots = (profile.availability && profile.availability[day]) || [];
                return (
                  <div key={day} className="availability-selector">
                    <span className="day-header">{day}</span>
                    <div className="slots-container">
                      {TIME_SLOTS.map(slot => {
                        const isActive = daySlots.includes(slot);
                        return (
                          <button
                            type="button"
                            key={slot}
                            onClick={() => toggleAvailability(day, slot)}
                            className={`slot-btn ${isActive ? 'active' : ''}`}
                          >
                            {slot.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
