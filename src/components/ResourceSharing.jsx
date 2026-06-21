import React from 'react';
import { Search, Plus, ThumbsUp, Link, FileText, HelpCircle, ArrowUpRight } from 'lucide-react';

export default function ResourceSharing({ group, currentStudent, onAddResource, onUpvoteResource }) {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Upvote tracking set per session
  const [upvotedIds, setUpvotedIds] = React.useState(new Set());

  const [newResource, setNewResource] = React.useState({
    title: '',
    type: 'link',
    content: '',
    category: 'Lecture Notes'
  });

  // Extract unique categories in this group's resources
  const categories = React.useMemo(() => {
    const defaultCats = ['All', 'Lecture Notes', 'Cheat Sheets', 'Practice Problems', 'Tools'];
    const customCats = group.resources.map(r => r.category);
    return Array.from(new Set([...defaultCats, ...customCats]));
  }, [group.resources]);

  const handleUpvote = (resourceId) => {
    if (upvotedIds.has(resourceId)) return; // Only allow one upvote per session
    onUpvoteResource(group.id, resourceId);
    setUpvotedIds(prev => {
      const next = new Set(prev);
      next.add(resourceId);
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newResource.title.trim() || !newResource.content.trim()) return;

    const resource = {
      id: `r-${Date.now()}`,
      title: newResource.title,
      type: newResource.type,
      content: newResource.content,
      postedBy: currentStudent.name,
      upvotes: 0,
      category: newResource.category
    };

    onAddResource(group.id, resource);
    setShowAddModal(false);
    setNewResource({
      title: '',
      type: 'link',
      content: '',
      category: 'Lecture Notes'
    });
  };

  const filteredResources = React.useMemo(() => {
    return group.resources.filter(res => {
      const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            res.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || res.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [group.resources, searchQuery, activeCategory]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3>Shared Resource Library</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Upload notes, share links, or post helpful practice problems for other group members.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Post Resource</span>
        </button>
      </div>

      {/* Search and Category Filter Buttons */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div className="search-bar" style={{ maxWidth: 'none', marginBottom: '1rem' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search notes, links, problems..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="resource-filters">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                padding: '0.35rem 0.85rem', 
                fontSize: '0.8rem', 
                borderRadius: '50px' 
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards List */}
      {filteredResources.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No study materials found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Get the collaboration started by uploading your first document or link!
          </p>
        </div>
      ) : (
        <div className="resource-list">
          {filteredResources.map(res => {
            const hasUpvoted = upvotedIds.has(res.id);
            return (
              <div key={res.id} className="resource-card">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
                  {/* Icon depending on resource type */}
                  <div 
                    style={{ 
                      padding: '0.75rem', 
                      background: 'var(--bg-tertiary)', 
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--primary)',
                      display: 'flex'
                    }}
                  >
                    {res.type === 'link' ? <Link size={18} /> : 
                     res.type === 'problem' ? <HelpCircle size={18} /> : 
                     <FileText size={18} />}
                  </div>

                  <div className="resource-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="resource-title">{res.title}</span>
                      <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        {res.category}
                      </span>
                    </div>
                    
                    {/* Content Display */}
                    {res.type === 'link' ? (
                      <a 
                        href={res.content} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--primary)', 
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          marginTop: '0.15rem'
                        }}
                      >
                        <span>{res.content}</span>
                        <ArrowUpRight size={12} />
                      </a>
                    ) : (
                      <div 
                        style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-secondary)', 
                          whiteSpace: 'pre-wrap',
                          marginTop: '0.25rem',
                          background: 'rgba(0, 0, 0, 0.15)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '4px',
                          borderLeft: '3px solid var(--primary)'
                        }}
                      >
                        {res.content}
                      </div>
                    )}

                    <div className="resource-meta" style={{ marginTop: '0.5rem' }}>
                      <span>Shared by: <strong>{res.postedBy}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Upvote Widget */}
                <div className="upvote-container" style={{ marginLeft: '1.5rem' }}>
                  <button 
                    onClick={() => handleUpvote(res.id)}
                    className={`upvote-btn ${hasUpvoted ? 'active' : ''}`}
                    disabled={hasUpvoted}
                    title={hasUpvoted ? 'You upvoted this' : 'Upvote resource'}
                  >
                    <ThumbsUp size={18} fill={hasUpvoted ? 'var(--primary)' : 'none'} />
                  </button>
                  <span className="upvote-count">{res.upvotes}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSubmit} className="modal-content">
            <div className="modal-header">
              <h3>Share Study Resource</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Title</label>
              <input 
                type="text" 
                placeholder="e.g. Integration Table Reference Sheets" 
                value={newResource.title}
                onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                className="form-input"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Resource Type</label>
                <select 
                  value={newResource.type} 
                  onChange={(e) => setNewResource(prev => ({ ...prev, type: e.target.value }))}
                  className="form-select"
                >
                  <option value="link">Web URL Link</option>
                  <option value="note">Study Notes / Text</option>
                  <option value="problem">Practice Problem</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  value={newResource.category} 
                  onChange={(e) => setNewResource(prev => ({ ...prev, category: e.target.value }))}
                  className="form-select"
                >
                  <option value="Lecture Notes">Lecture Notes</option>
                  <option value="Cheat Sheets">Cheat Sheets</option>
                  <option value="Practice Problems">Practice Problems</option>
                  <option value="Tools">Tools</option>
                  <option value="General Notes">General Notes</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {newResource.type === 'link' ? 'Website URL Link Address' : 'Resource Content / Body'}
              </label>
              {newResource.type === 'link' ? (
                <input 
                  type="url" 
                  placeholder="https://example.edu/notes/calculus" 
                  value={newResource.content}
                  onChange={(e) => setNewResource(prev => ({ ...prev, content: e.target.value }))}
                  className="form-input"
                  required
                />
              ) : (
                <textarea 
                  placeholder={
                    newResource.type === 'problem' ? 
                    'Write the practice problem details here... (e.g. Solve limit of sin(x)/x as x goes to 0)' :
                    'Type or copy-paste your study notes, formulas, or helpful definitions...'
                  }
                  value={newResource.content}
                  onChange={(e) => setNewResource(prev => ({ ...prev, content: e.target.value }))}
                  className="form-textarea"
                  rows="4"
                  required
                />
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <span>Upload to Library</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
