import React from 'react';
import { Search, Plus, Users, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { COURSES, STUDY_STYLES } from '../data/mockData';

export default function GroupDirectory({ 
  groups, 
  currentStudent, 
  onJoinGroup, 
  onLeaveGroup, 
  onCreateGroup 
}) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [courseFilter, setCourseFilter] = React.useState('All');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newGroup, setNewGroup] = React.useState({
    name: '',
    course: COURSES[0],
    description: '',
    maxSize: 4,
    studyStyle: 'discussion'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGroup(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onCreateGroup({
      ...newGroup,
      id: `g-${Date.now()}`,
      members: [currentStudent.id],
      goals: [],
      meetings: [],
      resources: [],
      messages: [
        {
          id: `welcome-${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          content: `Welcome to the newly created group: ${newGroup.name}! Set goals, schedule calls, or upload resources to get started.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
    // Reset and close
    setNewGroup({
      name: '',
      course: COURSES[0],
      description: '',
      maxSize: 4,
      studyStyle: 'discussion'
    });
    setShowCreateModal(false);
  };

  const filteredGroups = React.useMemo(() => {
    return groups.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            group.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = courseFilter === 'All' || group.course === courseFilter;
      return matchesSearch && matchesCourse;
    });
  }, [groups, searchQuery, courseFilter]);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Group Directory</h1>
          <p>Find existing study groups or create a new dedicated space for collaboration in your classes.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Create Group</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card directory-actions" style={{ marginBottom: '2rem' }}>
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search study groups..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={16} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Course:</span>
          <select 
            value={courseFilter} 
            onChange={(e) => setCourseFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: '200px' }}
          >
            <option value="All">All Courses</option>
            {COURSES.map(course => (
              <option key={course} value={course}>{course.split(':')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No study groups found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Be the first to create a group for this course!
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            <Plus size={16} />
            <span>Create Study Group</span>
          </button>
        </div>
      ) : (
        <div className="group-grid">
          {filteredGroups.map(group => {
            const isMember = group.members.includes(currentStudent.id);
            const isFull = group.members.length >= group.maxSize;
            const styleObj = STUDY_STYLES.find(s => s.id === group.studyStyle) || { name: group.studyStyle };
            
            return (
              <div key={group.id} className="glass-card group-card">
                <div className="group-card-header">
                  <div className="group-card-title">
                    <h3>{group.name}</h3>
                    <span className="group-card-course">{group.course.split(':')[0]}</span>
                  </div>
                  <span className="badge badge-primary">
                    {styleObj.name}
                  </span>
                </div>

                <p className="group-card-desc">{group.description}</p>

                <div className="group-meta-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={14} />
                    <span>{group.members.length} / {group.maxSize} Members</span>
                  </div>
                  {isFull && !isMember && (
                    <span className="badge badge-warning">Group Full</span>
                  )}
                </div>

                <div>
                  {isMember ? (
                    <button 
                      onClick={() => onLeaveGroup(group.id)}
                      className="btn btn-danger"
                      style={{ width: '100%' }}
                    >
                      Leave Workspace
                    </button>
                  ) : (
                    <button 
                      onClick={() => onJoinGroup(group.id)}
                      disabled={isFull}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Join Workspace
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <form onSubmit={handleCreateSubmit} className="modal-content">
            <div className="modal-header">
              <h3>Create Study Group</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Group Name</label>
              <input 
                type="text" 
                name="name" 
                value={newGroup.name} 
                onChange={handleInputChange}
                className="form-input" 
                placeholder="e.g. Calculus midterm study group"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject Course</label>
              <select 
                name="course" 
                value={newGroup.course} 
                onChange={handleInputChange}
                className="form-select"
                required
              >
                {COURSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                name="description" 
                value={newGroup.description} 
                onChange={handleInputChange}
                className="form-textarea" 
                rows="3"
                placeholder="Describe study agenda, materials to share, or specific target students..."
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Max Group Size</label>
                <select 
                  name="maxSize" 
                  value={newGroup.maxSize} 
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value={2}>2 (1-on-1)</option>
                  <option value={3}>3 members</option>
                  <option value={4}>4 members</option>
                  <option value={5}>5 members</option>
                  <option value={6}>6 members</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Study Style Preference</label>
                <select 
                  name="studyStyle" 
                  value={newGroup.studyStyle} 
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {STUDY_STYLES.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <Plus size={16} />
              <span>Create Group Space</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
