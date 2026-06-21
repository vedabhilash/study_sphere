import React from 'react';
import { Plus, CheckSquare, Square, Trash2, Award, CheckCircle2, ListTodo } from 'lucide-react';

export default function GoalTracker({ group, onAddGoal, onToggleSubtask, onDeleteGoal }) {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [goalTitle, setGoalTitle] = React.useState('');
  
  // List of subtask titles to be added
  const [subtasksInput, setSubtasksInput] = React.useState(['', '']);

  const handleSubtaskInputChange = (index, value) => {
    setSubtasksInput(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addSubtaskField = () => {
    setSubtasksInput(prev => [...prev, '']);
  };

  const removeSubtaskField = (index) => {
    if (subtasksInput.length <= 1) return;
    setSubtasksInput(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    // Filter out blank subtasks
    const cleanSubtasks = subtasksInput
      .filter(task => task.trim() !== '')
      .map((task, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: task,
        completed: false
      }));

    const newGoal = {
      id: `goal-${Date.now()}`,
      title: goalTitle,
      completed: false,
      subtasks: cleanSubtasks
    };

    onAddGoal(group.id, newGoal);
    
    // Reset states
    setGoalTitle('');
    setSubtasksInput(['', '']);
    setShowAddModal(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3>Group Goal Tracker</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Set, divide, and monitor your academic milestones. Tick off finished tasks to track progress.
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Add Objective</span>
        </button>
      </div>

      {group.goals.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <ListTodo size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No goals created yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Set your first study goal to coordinate milestones with your group!
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            <Plus size={16} />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="goal-list">
          {group.goals.map(goal => {
            const totalTasks = goal.subtasks.length;
            const completedTasks = goal.subtasks.filter(t => t.completed).length;
            const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const isFinished = progressPercent === 100 && totalTasks > 0;

            return (
              <div key={goal.id} className="glass-card goal-card" style={{ 
                borderLeft: isFinished ? '4px solid var(--success)' : '1px solid var(--border-glass)' 
              }}>
                <div className="goal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isFinished ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    ) : (
                      <ListTodo size={18} style={{ color: 'var(--primary)' }} />
                    )}
                    <span className="goal-title" style={{ 
                      textDecoration: isFinished ? 'line-through' : 'none',
                      color: isFinished ? 'var(--text-secondary)' : 'var(--text-primary)'
                    }}>
                      {goal.title}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => onDeleteGoal(group.id, goal.id)}
                    className="btn btn-secondary btn-icon"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                    title="Delete Goal"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Progress Indicators */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  <span>Progress</span>
                  <span>{completedTasks} / {totalTasks} Tasks ({progressPercent}%)</span>
                </div>
                <div className="goal-progress-bar-bg">
                  <div 
                    className="goal-progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Subtask Checkboxes */}
                <div className="subtasks-list">
                  {goal.subtasks.map(sub => (
                    <div 
                      key={sub.id} 
                      onClick={() => onToggleSubtask(group.id, goal.id, sub.id)}
                      className={`subtask-item ${sub.completed ? 'completed' : ''}`}
                    >
                      {sub.completed ? (
                        <CheckSquare size={16} className="text-primary" style={{ color: 'var(--primary)' }} />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>{sub.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSubmit} className="modal-content">
            <div className="modal-header">
              <h3>Create Group Objective</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="modal-close">×</button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Objective Title</label>
              <input 
                type="text" 
                placeholder="e.g. Master Trigonometric Integration" 
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Action Checklist Items</label>
                <button 
                  type="button" 
                  onClick={addSubtaskField}
                  className="btn btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {subtasksInput.map((task, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder={`Task item ${idx + 1}`} 
                      value={task}
                      onChange={(e) => handleSubtaskInputChange(idx, e.target.value)}
                      className="form-input"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => removeSubtaskField(idx)}
                      disabled={subtasksInput.length <= 1}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem', width: '36px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <span>Create Objective</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
