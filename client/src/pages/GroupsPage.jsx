import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Plus, 
  Lock, 
  Globe, 
  Key, 
  X, 
  Loader, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import './GroupsPage.css';

const GroupsPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Search/Filters
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Create Group Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is a member of the group
  const isMember = (groupId) => {
    return user?.groupsJoined?.some(g => g._id === groupId);
  };

  // Join Group handler
  const handleJoinGroup = async (groupId) => {
    try {
      const res = await axios.post('/api/groups/join', { groupId });
      await refreshUser();
      navigate(`/groups/${res.data.group._id}`);
    } catch (err) {
      console.error('Error joining group:', err);
      alert(err.response?.data?.message || 'Failed to join group');
    }
  };

  // Join via Invite Code
  const handleJoinInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteCode) return;

    try {
      const res = await axios.post('/api/groups/join', { inviteCode });
      setInviteSuccess('Joined successfully!');
      await refreshUser();
      setTimeout(() => {
        navigate(`/groups/${res.data.group._id}`);
      }, 1000);
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Invalid invite code');
    }
  };

  // Create Group handler
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newGroupName || !newGroupSubject) {
      return setCreateError('Name and Subject are required');
    }

    try {
      setCreateLoading(true);
      const res = await axios.post('/api/groups', {
        name: newGroupName,
        description: newGroupDesc,
        subject: newGroupSubject,
        isPrivate: newGroupPrivate
      });

      await refreshUser();
      setShowCreateModal(false);
      navigate(`/groups/${res.data._id}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter groups in UI
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesSubject = subjectFilter === '' || group.subject.toLowerCase() === subjectFilter.toLowerCase();
    
    return matchesSearch && matchesSubject;
  });

  // Extract unique subjects for filter options
  const subjects = [...new Set(groups.map(g => g.subject))];

  return (
    <div className="main-content animate-fade-in">
      
      {/* Header and Title */}
      <div className="groups-header">
        <div className="groups-title-row">
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Explore Study Groups</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Find peers studying the same subjects, share files, and chat in real-time.</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Create Study Group</span>
          </button>
        </div>

        {/* Search & Invite code filters */}
        <div className="search-filters-row">
          {/* Group searching */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search groups, subjects, tags..."
                className="form-input"
                style={{ paddingLeft: '40px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '150px' }}
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map((subj, idx) => (
                <option key={idx} value={subj}>{subj}</option>
              ))}
            </select>
          </div>

          {/* Join private by Invite Code */}
          <form onSubmit={handleJoinInvite} className="invite-code-box">
            <div style={{ position: 'relative', flex: 1 }}>
              <Key size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Enter Invite Code"
                className="form-input"
                style={{ paddingLeft: '32px', paddingTop: '8px', paddingBottom: '8px', fontSize: '0.875rem' }}
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
              Join
            </button>
          </form>
        </div>

        {inviteError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '-8px' }}>{inviteError}</p>}
        {inviteSuccess && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '-8px' }}>{inviteSuccess}</p>}
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Loader size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Users size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
          <p>No study groups found matching your criteria.</p>
          <button onClick={() => { setSearchQuery(''); setSubjectFilter(''); }} className="btn btn-secondary" style={{ marginTop: '16px' }}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {filteredGroups.map((group) => {
            const userJoined = isMember(group._id);
            return (
              <div key={group._id} className="group-explore-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="group-explore-title">{group.name}</span>
                    {group.isPrivate ? (
                      <span title="Private group requires invite code" style={{ display: 'flex', color: 'var(--text-muted)' }}>
                        <Lock size={14} />
                      </span>
                    ) : (
                      <span title="Public group" style={{ display: 'flex', color: 'var(--text-muted)' }}>
                        <Globe size={14} />
                      </span>
                    )}
                  </div>
                  <span className="group-explore-subject">{group.subject}</span>
                  <p className="group-explore-desc">{group.description || 'No description provided.'}</p>
                </div>

                <div className="group-explore-footer">
                  <span className="group-explore-members">
                    <Users size={14} />
                    <span>{group.members?.length || 0} members</span>
                  </span>
                  
                  {userJoined ? (
                    <button 
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Enter Group
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleJoinGroup(group._id)}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Join Group
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Create Study Group</h3>
              <button onClick={() => setShowCreateModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="auth-error">
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Physics 101 Midterm Study"
                  className="form-input"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Calculus, Spanish"
                  className="form-input"
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Describe your study goals, guidelines, and schedule..."
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newGroupPrivate}
                  onChange={(e) => setNewGroupPrivate(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isPrivate" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                  Make this group Private (Invite Code Required)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear' }} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Group</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupsPage;
