import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Edit2, Check, X, Award, HelpCircle, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import './Profile.css';

const presetCategories = ['Programming', 'AI', 'Design', 'Languages', 'Mathematics', 'Business', 'Soft Skills', 'Music', 'Photography'];

const MySkills = () => {
  const { user, refreshUser } = useAuth();
  
  // Active Form
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState(presetCategories[0]);
  const [level, setLevel] = useState('Intermediate'); // Beginner | Intermediate | Advanced | Expert
  const [priority, setPriority] = useState('Medium'); // Low | Medium | High
  const [type, setType] = useState('teach'); // teach | learn

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editLevel, setEditLevel] = useState('Intermediate');
  const [editPriority, setEditPriority] = useState('Medium');

  // Status Alerts
  const [alert, setAlert] = useState(null);
  const [saving, setSaving] = useState(false);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) {
      triggerAlert('error', 'Please enter a skill name.');
      return;
    }

    setSaving(true);
    try {
      await axios.post('/api/users/skills', {
        name: skillName.trim(),
        category,
        level: type === 'teach' ? level : undefined,
        priority: type === 'learn' ? priority : undefined,
        type
      });

      triggerAlert('success', 'Skill added successfully!');
      setSkillName('');
      refreshUser();
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to add skill.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (id, skillType) => {
    try {
      await axios.delete(`/api/users/skills/${id}?type=${skillType}`);
      triggerAlert('success', 'Skill removed successfully.');
      refreshUser();
    } catch (err) {
      triggerAlert('error', 'Failed to remove skill.');
    }
  };

  const handleSaveEdit = async (id, skillType) => {
    try {
      await axios.put('/api/users/skills', {
        skillId: id,
        level: skillType === 'teach' ? editLevel : undefined,
        priority: skillType === 'learn' ? editPriority : undefined,
        type: skillType
      });
      triggerAlert('success', 'Skill updated successfully.');
      setEditingId(null);
      refreshUser();
    } catch (err) {
      triggerAlert('error', 'Failed to update skill.');
    }
  };

  return (
    <div className="profile-container">
      {alert && (
        <div className={`form-alert ${alert.type}`} style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1100 }}>
          {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="profile-page-header">
        <h1 className="profile-page-title">My Skills Swap Inventory</h1>
        <p className="profile-page-subtitle">Add skills you can teach to earn credits, and specify skills you want to learn.</p>
      </div>

      <div className="profile-card">
        {/* Add Skill Form */}
        <form onSubmit={handleAddSkill} className="profile-form">
          <h3 className="preference-section-title">Add New Skill</h3>
          
          <div className="profile-form-grid">
            <div className="profile-field-group">
              <label className="form-label">Skill Swap Mode</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label className="btn btn-secondary" style={{ flex: 1, background: type === 'teach' ? '#ffffff' : '#121212', color: type === 'teach' ? '#000' : '#fff', border: '1px solid #404040' }}>
                  <input type="radio" name="skillType" checked={type === 'teach'} onChange={() => setType('teach')} style={{ display: 'none' }} />
                  I Can Teach
                </label>
                <label className="btn btn-secondary" style={{ flex: 1, background: type === 'learn' ? '#ffffff' : '#121212', color: type === 'learn' ? '#000' : '#fff', border: '1px solid #404040' }}>
                  <input type="radio" name="skillType" checked={type === 'learn'} onChange={() => setType('learn')} style={{ display: 'none' }} />
                  I Want To Learn
                </label>
              </div>
            </div>

            <div className="profile-field-group">
              <label className="form-label">Skill Name</label>
              <input 
                type="text" 
                placeholder="e.g. React, French, Calculus, Figma..." 
                className="form-input" 
                value={skillName}
                onChange={e => setSkillName(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="profile-field-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} style={{ background: '#080808', color: '#fff' }}>
                {presetCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {type === 'teach' ? (
              <div className="profile-field-group">
                <label className="form-label">My Expertise Level</label>
                <select className="form-input" value={level} onChange={e => setLevel(e.target.value)} style={{ background: '#080808', color: '#fff' }}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            ) : (
              <div className="profile-field-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={priority} onChange={e => setPriority(e.target.value)} style={{ background: '#080808', color: '#fff' }}>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: 'fit-content', alignSelf: 'flex-end' }}>
            <Plus size={16} />
            <span>Add Skill to Profile</span>
          </button>
        </form>

        <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />

        {/* Teach Skills Inventory */}
        <div>
          <h3 className="preference-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} />
            <span>Skills I Teach</span>
          </h3>
          {(!user.skillsCanTeach || user.skillsCanTeach.length === 0) ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>No teaching skills listed. Share your expertise to earn credits.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {user.skillsCanTeach.map((skill) => (
                <div key={skill._id} className="preference-card" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                  <div>
                    <span className="preference-card-text" style={{ fontWeight: '700' }}>{skill.name}</span>
                    <span className="tag-badge" style={{ marginLeft: '12px', fontSize: '0.75rem' }}>{skill.category}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {editingId === skill._id ? (
                      <>
                        <select 
                          className="form-input" 
                          value={editLevel} 
                          onChange={e => setEditLevel(e.target.value)} 
                          style={{ padding: '6px 12px', background: '#080808', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                        <button className="btn-logout" onClick={() => handleSaveEdit(skill._id, 'teach')} style={{ color: '#ffffff', borderColor: '#404040', background: 'transparent', padding: '6px' }} title="Save">
                          <Check size={16} />
                        </button>
                        <button className="btn-logout" onClick={() => setEditingId(null)} style={{ color: '#888', borderColor: 'transparent', background: 'transparent', padding: '6px' }} title="Cancel">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{skill.level}</span>
                        <button className="btn-logout" onClick={() => { setEditingId(skill._id); setEditLevel(skill.level); }} style={{ color: '#888', borderColor: 'transparent', background: 'transparent', padding: '6px' }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-logout" onClick={() => handleDeleteSkill(skill._id, 'teach')} style={{ color: '#ff4d4f', borderColor: 'transparent', background: 'transparent', padding: '6px' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learn Skills Inventory */}
        <div style={{ marginTop: '24px' }}>
          <h3 className="preference-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} />
            <span>Skills I Want to Learn</span>
          </h3>
          {(!user.skillsToLearn || user.skillsToLearn.length === 0) ? (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px' }}>No learning desires listed. Add skills to get compatibility recommendations.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {user.skillsToLearn.map((skill) => (
                <div key={skill._id} className="preference-card" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                  <div>
                    <span className="preference-card-text" style={{ fontWeight: '700' }}>{skill.name}</span>
                    <span className="tag-badge-accent" style={{ marginLeft: '12px', fontSize: '0.75rem' }}>{skill.category}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {editingId === skill._id ? (
                      <>
                        <select 
                          className="form-input" 
                          value={editPriority} 
                          onChange={e => setEditPriority(e.target.value)} 
                          style={{ padding: '6px 12px', background: '#080808', color: '#fff', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                        <button className="btn-logout" onClick={() => handleSaveEdit(skill._id, 'learn')} style={{ color: '#ffffff', borderColor: '#404040', background: 'transparent', padding: '6px' }} title="Save">
                          <Check size={16} />
                        </button>
                        <button className="btn-logout" onClick={() => setEditingId(null)} style={{ color: '#888', borderColor: 'transparent', background: 'transparent', padding: '6px' }} title="Cancel">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{skill.priority} Priority</span>
                        <button className="btn-logout" onClick={() => { setEditingId(skill._id); setEditPriority(skill.priority); }} style={{ color: '#888', borderColor: 'transparent', background: 'transparent', padding: '6px' }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-logout" onClick={() => handleDeleteSkill(skill._id, 'learn')} style={{ color: '#ff4d4f', borderColor: 'transparent', background: 'transparent', padding: '6px' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySkills;
