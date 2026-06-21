import React from 'react';
import Navbar from './components/Navbar';
import ProfileView from './components/ProfileView';
import MatchDashboard from './components/MatchDashboard';
import GroupDirectory from './components/GroupDirectory';
import GroupWorkspace from './components/GroupWorkspace';

import { api } from './services/api';
import { io } from 'socket.io-client';
import { Send, X, GraduationCap, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

// Single Socket Instance
let socket;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authMode, setAuthMode] = React.useState('login'); // 'login' | 'register'
  const [authError, setAuthError] = React.useState('');
  
  // Auth Form inputs
  const [authForm, setAuthForm] = React.useState({
    name: '',
    email: '',
    password: ''
  });

  // App States from DB
  const [currentStudent, setCurrentStudent] = React.useState(null);
  const [allStudents, setAllStudents] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [matches, setMatches] = React.useState([]);

  // Routing
  const [activeTab, setActiveTab] = React.useState('profile');
  const activeTabRef = React.useRef('profile');
  React.useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const [activeGroup, setActiveGroup] = React.useState(null);
  const activeGroupRef = React.useRef(null);
  React.useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  // Floating Quick Chat Modal State
  const [quickChatStudent, setQuickChatStudent] = React.useState(null);
  const quickChatStudentRef = React.useRef(null);
  React.useEffect(() => {
    quickChatStudentRef.current = quickChatStudent;
  }, [quickChatStudent]);

  const [quickChatInput, setQuickChatInput] = React.useState('');
  const [quickChatHistory, setQuickChatHistory] = React.useState([]);
  const [quickChatTyping, setQuickChatTyping] = React.useState(false);
  const quickChatScrollRef = React.useRef(null);

  // Notifications State
  const [notifications, setNotifications] = React.useState({});
  const [unreadGroups, setUnreadGroups] = React.useState({});
  const [toast, setToast] = React.useState({ show: false, title: '', content: '', senderId: null, groupId: null });

  // Check login session on mount
  React.useEffect(() => {
    const token = api.auth.getToken();
    if (token) {
      loadSession();
    }
  }, []);

  // Auto-dismiss toast notification after 5s
  React.useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Initialize socket when authenticated
  React.useEffect(() => {
    if (isAuthenticated && currentStudent) {
      // Connect to Socket server
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      socket = io(API_BASE_URL);

      socket.on('connect', () => {
        console.log('Socket channel active:', socket.id);
        socket.emit('registerUser', { userId: currentStudent.id });
      });

      if (socket.connected) {
        console.log('Socket channel already active on mount:', socket.id);
        socket.emit('registerUser', { userId: currentStudent.id });
      }

      // Listen for group metadata updates (members, goals, meetings, resources)
      socket.on('groupUpdated', (updatedGroup) => {
        setGroups(prev => 
          prev.map(g => g.id === updatedGroup.id ? updatedGroup : g)
        );
      });

      // Listen for group message broadcasts
      socket.on('messageReceived', ({ groupId, message }) => {
        setGroups(prev => 
          prev.map(g => {
            if (g.id === groupId) {
              // Avoid duplicate messages if socket loops
              const exists = g.messages.some(m => m.id === message.id);
              if (exists) return g;
              return {
                ...g,
                messages: [...g.messages, message]
              };
            }
            return g;
          })
        );

        // Show notification badge for the group if not active workspace
        if (activeTabRef.current !== 'workspace' || !activeGroupRef.current || activeGroupRef.current.id !== groupId) {
          setUnreadGroups(prev => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1
          }));

          setToast({
            show: true,
            title: `New in ${message.senderName || 'Group'}`,
            content: `${message.senderName}: ${message.content}`,
            groupId: groupId
          });
        }
      });

      // Listen for private direct messages
      socket.on('incomingDirectMessage', (message) => {
        const senderId = message.senderId;
        if (quickChatStudentRef.current && String(quickChatStudentRef.current.id) === String(senderId)) {
          setQuickChatHistory(prev => [...prev, message]);
        } else {
          setNotifications(prev => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1
          }));

          setToast({
            show: true,
            title: `New message from ${message.senderName || 'Peer'}`,
            content: message.content,
            senderId: senderId
          });
        }
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [isAuthenticated, currentStudent]);

  // Load backend data
  const loadSession = async () => {
    try {
      const user = await api.auth.me();
      setCurrentStudent(user);
      setIsAuthenticated(true);
      
      // Load other records
      const usersList = await api.users.getList();
      setAllStudents(usersList);
      
      const userMatches = await api.users.getMatches();
      setMatches(userMatches);

      const allGroups = await api.groups.getAll();
      setGroups(allGroups);

      setActiveTab('profile');
    } catch (error) {
      console.error('Failed to load session:', error);
      api.auth.logout();
      setIsAuthenticated(false);
    }
  };

  // Sync active group if groups array updates
  React.useEffect(() => {
    if (activeGroup) {
      const updated = groups.find(g => g.id === activeGroup.id);
      if (updated) {
        setActiveGroup(updated);
      }
    }
  }, [groups, activeGroup]);

  // Join/Leave socket room when workspace updates
  React.useEffect(() => {
    if (socket && activeGroup && activeTab === 'workspace') {
      socket.emit('joinGroup', { groupId: activeGroup.id });

      return () => {
        socket.emit('leaveGroup', { groupId: activeGroup.id });
      };
    }
  }, [activeGroup, activeTab]);

  // Auto-scroll floating quick chat
  React.useEffect(() => {
    if (quickChatScrollRef.current) {
      quickChatScrollRef.current.scrollTop = quickChatScrollRef.current.scrollHeight;
    }
  }, [quickChatHistory]);

  const joinedGroups = React.useMemo(() => {
    if (!currentStudent) return [];
    return groups.filter(g => g.members.includes(currentStudent.id));
  }, [groups, currentStudent]);

  // 4. Action Handlers

  // Auth Operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        const user = await api.auth.login(authForm.email, authForm.password);
        setCurrentStudent(user);
        setIsAuthenticated(true);
        loadSession();
      } else {
        const user = await api.auth.register(authForm.name, authForm.email, authForm.password);
        setCurrentStudent(user);
        setIsAuthenticated(true);
        loadSession();
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
    setCurrentStudent(null);
    if (socket) socket.disconnect();
  };

  // Profile Save
  const handleSaveProfile = async (updatedProfile) => {
    try {
      const saved = await api.users.updateProfile(updatedProfile);
      setCurrentStudent(saved);
      
      // Refresh lists
      const usersList = await api.users.getList();
      setAllStudents(usersList);
      
      const userMatches = await api.users.getMatches();
      setMatches(userMatches);
    } catch (error) {
      alert('Error saving profile: ' + error.message);
    }
  };

  // Group Workspace Joins & Leaves
  const handleJoinGroup = async (groupId) => {
    try {
      const updatedGroup = await api.groups.join(groupId);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
    } catch (error) {
      alert('Join error: ' + error.message);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const updatedGroup = await api.groups.leave(groupId);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
      
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
        setActiveTab('groups');
      }
    } catch (error) {
      alert('Leave error: ' + error.message);
    }
  };

  const handleCreateGroup = async (newGroupObj) => {
    try {
      const created = await api.groups.create(newGroupObj);
      setGroups(prev => [...prev, created]);
      setActiveGroup(created);
      setActiveTab('workspace');
    } catch (error) {
      alert('Group creation error: ' + error.message);
    }
  };

  // Group actions
  const handleSendMessage = (groupId, message) => {
    // Send over socket instead of REST to trigger real-time relays
    if (socket) {
      socket.emit('sendMessage', { groupId, message });
    }
  };

  const handleScheduleMeeting = async (groupId, meeting) => {
    try {
      const updatedGroup = await api.groups.scheduleMeeting(groupId, meeting);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
    } catch (error) {
      alert('Schedule error: ' + error.message);
    }
  };

  const handleAddResource = async (groupId, resource) => {
    try {
      const updatedGroup = await api.groups.addResource(groupId, resource);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
    } catch (error) {
      alert('Error uploading resource: ' + error.message);
    }
  };

  const handleUpvoteResource = async (groupId, resourceId) => {
    try {
      const updatedGroup = await api.groups.upvoteResource(groupId, resourceId);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
    } catch (error) {
      alert('Error upvoting resource: ' + error.message);
    }
  };

  const handleAddGoal = async (groupId, goal) => {
    try {
      const updatedGroup = await api.groups.addGoal(groupId, goal);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
    } catch (error) {
      alert('Error creating goal: ' + error.message);
    }
  };

  const handleToggleSubtask = async (groupId, goalId, subtaskId) => {
    try {
      const updatedGroup = await api.groups.toggleSubtask(groupId, goalId, subtaskId);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
    } catch (error) {
      alert('Error toggling task: ' + error.message);
    }
  };

  const handleDeleteGoal = async (groupId, goalId) => {
    try {
      const updatedGroup = await api.groups.deleteGoal(groupId, goalId);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
    } catch (error) {
      alert('Error deleting goal: ' + error.message);
    }
  };

  const handleInviteStudentToGroup = async (studentId, groupId) => {
    try {
      const updatedGroup = await api.groups.invite(groupId, studentId);
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
      alert('Invitation sent successfully!');
    } catch (error) {
      alert('Invitation error: ' + error.message);
    }
  };

  const handleSubmitFeedback = (groupId, feedbackObj) => {
    console.log("Feedback submitted", groupId, feedbackObj);
  };

  // 5. Floating Quick Socket Direct Message Handlers
  const handleOpenQuickChat = (student) => {
    setQuickChatStudent(student);
    
    // Clear notifications for this student
    setNotifications(prev => ({
      ...prev,
      [student.id]: 0
    }));

    setQuickChatHistory([
      {
        id: 'start',
        sender: 'them',
        senderId: student.id,
        senderName: student.name,
        content: `Hey! I saw that we got matching compatibility for study groups. What classes are you working on?`,
        time: 'Just now'
      }
    ]);
  };

  const handleSendQuickMessage = (e) => {
    e.preventDefault();
    if (!quickChatInput.trim() || !quickChatStudent) return;

    const userMsg = {
      id: `qm-user-${Date.now()}`,
      sender: 'me',
      senderId: currentStudent.id,
      senderName: currentStudent.name,
      content: quickChatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setQuickChatHistory(prev => [...prev, userMsg]);
    
    if (socket) {
      socket.emit('sendDirectMessage', { 
        receiverId: quickChatStudent.id, 
        message: { ...userMsg, sender: 'them' } 
      });
    }
    
    setQuickChatInput('');
  };

  // Render Login UI if unauthenticated
  if (!isAuthenticated) {
    return (
      <div 
        className="app-container" 
        style={{ 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.15) 0px, transparent 50%)' 
        }}
      >
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
              <GraduationCap size={28} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              StudySphere
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
              Connect with academically compatible peer students and collaborative study groups.
            </p>
          </div>

          {authError && (
            <div 
              style={{ 
                background: 'rgba(239, 68, 68, 0.08)', 
                border: '1px solid rgba(239, 68, 68, 0.2)', 
                color: '#ff6b6b',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authMode === 'register' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Alex Rivera"
                    value={authForm.name}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input" 
                    style={{ paddingLeft: '2.25rem' }}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="alex@university.edu"
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input" 
                  style={{ paddingLeft: '2.25rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  className="form-input" 
                  style={{ paddingLeft: '2.25rem' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <span>{authMode === 'login' ? 'Login' : 'Sign Up'}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', padding: 0 }}
            >
              {authMode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Application UI
  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
        joinedGroups={joinedGroups}
        currentStudent={currentStudent}
        unreadGroups={unreadGroups}
        onClearGroupUnread={(groupId) => setUnreadGroups(prev => ({ ...prev, [groupId]: 0 }))}
        notifications={notifications}
      />

      {/* Main Container */}
      <main className="main-content">
        
        {activeTab === 'profile' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
                Logout Session
              </button>
            </div>
            <ProfileView 
              studentProfile={currentStudent} 
              onSave={handleSaveProfile} 
            />
          </div>
        )}

        {activeTab === 'matches' && (
          <MatchDashboard 
            currentStudent={currentStudent} 
            allStudents={allStudents}
            joinedGroups={joinedGroups}
            onInviteToGroup={handleInviteStudentToGroup}
            onOpenQuickChat={handleOpenQuickChat}
            notifications={notifications}
          />
        )}

        {activeTab === 'groups' && (
          <GroupDirectory 
            groups={groups}
            currentStudent={currentStudent}
            onJoinGroup={handleJoinGroup}
            onLeaveGroup={handleLeaveGroup}
            onCreateGroup={handleCreateGroup}
          />
        )}

        {activeTab === 'workspace' && activeGroup && (
          <GroupWorkspace 
            group={activeGroup}
            currentStudent={currentStudent}
            allStudents={allStudents}
            socket={socket}
            onSendMessage={handleSendMessage}
            onScheduleMeeting={handleScheduleMeeting}
            onAddResource={handleAddResource}
            onUpvoteResource={handleUpvoteResource}
            onAddGoal={handleAddGoal}
            onToggleSubtask={handleToggleSubtask}
            onDeleteGoal={handleDeleteGoal}
            onLeaveGroup={handleLeaveGroup}
            onSubmitFeedback={handleSubmitFeedback}
          />
        )}

      </main>

      {/* Floating Quick Chat Widget */}
      {quickChatStudent && (
        <div 
          className="glass-card" 
          style={{ 
            position: 'fixed', 
            bottom: '1.5rem', 
            right: '1.5rem', 
            width: '320px', 
            height: '420px', 
            zIndex: 100, 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 0,
            borderColor: 'var(--primary)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              background: 'var(--primary-gradient)', 
              color: 'white', 
              padding: '0.75rem 1rem', 
              borderTopLeftRadius: 'var(--radius-md)', 
              borderTopRightRadius: 'var(--radius-md)',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.2)', border: 'none' }}>
                {quickChatStudent.avatar}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{quickChatStudent.name}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>{quickChatStudent.matchScore}% Match</span>
              </div>
            </div>
            <button 
              onClick={() => setQuickChatStudent(null)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Log */}
          <div 
            ref={quickChatScrollRef}
            style={{ 
              flex: 1, 
              padding: '1rem', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              background: 'rgba(0, 0, 0, 0.2)' 
            }}
          >
            {quickChatHistory.map(msg => {
              const isMe = msg.sender === 'me';
              return (
                <div 
                  key={msg.id} 
                  style={{
                    maxWidth: '80%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    background: isMe ? 'var(--primary-gradient)' : 'var(--bg-tertiary)',
                    color: isMe ? 'white' : 'var(--text-primary)',
                    borderTopRightRadius: isMe ? '2px' : 'var(--radius-md)',
                    borderTopLeftRadius: isMe ? 'var(--radius-md)' : '2px',
                    position: 'relative'
                  }}
                >
                  <div>{msg.content}</div>
                  <span style={{ fontSize: '0.6rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '0.15rem' }}>
                    {msg.time}
                  </span>
                </div>
              );
            })}

            {quickChatTyping && (
              <div 
                style={{ 
                  maxWidth: '80%', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.85rem',
                  alignSelf: 'flex-start', 
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  borderTopLeftRadius: '2px',
                  fontStyle: 'italic'
                }}
              >
                Typing...
              </div>
            )}
          </div>

          {/* Input Panel */}
          <form 
            onSubmit={handleSendQuickMessage} 
            style={{ 
              padding: '0.75rem', 
              borderTop: '1px solid var(--border-glass)', 
              background: 'var(--bg-secondary)', 
              display: 'flex', 
              gap: '0.5rem',
              borderBottomLeftRadius: 'var(--radius-md)',
              borderBottomRightRadius: 'var(--radius-md)' 
            }}
          >
            <input 
              type="text" 
              placeholder="Send direct message..." 
              value={quickChatInput}
              onChange={(e) => setQuickChatInput(e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ padding: '0.5rem', width: '36px', height: '36px', flexShrink: 0 }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div 
          className="glass-card"
          onClick={() => {
            if (toast.groupId) {
              const group = groups.find(g => g.id === toast.groupId);
              if (group) {
                setActiveGroup(group);
                setActiveTab('workspace');
                setUnreadGroups(prev => ({ ...prev, [toast.groupId]: 0 }));
              }
            } else if (toast.senderId) {
              const student = allStudents.find(s => s.id === toast.senderId);
              if (student) {
                handleOpenQuickChat(student);
              }
            }
            setToast({ show: false, title: '', content: '', senderId: null, groupId: null });
          }}
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 1000,
            cursor: 'pointer',
            padding: '1rem',
            width: '300px',
            borderLeft: '4px solid var(--primary)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', gap: '1rem' }}>
            <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{toast.title}</strong>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setToast({ show: false, title: '', content: '', senderId: null, groupId: null });
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toast.content}
          </p>
        </div>
      )}
    </div>
  );
}
