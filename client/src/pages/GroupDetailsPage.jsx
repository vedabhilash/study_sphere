import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Lock, 
  Globe, 
  Key, 
  Send, 
  Paperclip, 
  Plus, 
  ThumbsUp, 
  Download, 
  Trash2, 
  Clock, 
  LogOut, 
  X, 
  Loader, 
  ExternalLink,
  ChevronRight,
  Search,
  Video,
  Smile,
  CornerDownRight
} from 'lucide-react';
import './GroupDetailsPage.css';
import VirtualRoom from '../components/VirtualRoom';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { groupsAPI, messagesAPI, resourcesAPI } from '../utils/apiService';

const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${import.meta.env.VITE_API_URL || ''}${url}`;
};

const GroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'chat';

  const { user, refreshUser } = useAuth();
  const socket = useSocket();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chat tab states
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [chatFile, setChatFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Advanced Chat states
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Resources tab states
  const [resources, setResources] = useState([]);
  const [resSearch, setResSearch] = useState('');
  const [showResModal, setShowResModal] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState('pdf');
  const [resLink, setResLink] = useState('');
  const [resTags, setResTags] = useState('');
  const [resFile, setResFile] = useState(null);
  const [resLoading, setResLoading] = useState(false);

  // Sessions tab states
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionStart, setSessionStart] = useState('');
  const [sessionEnd, setSessionEnd] = useState('');
  const [sessionLoading, setSessionLoading] = useState(false);

  // Load Group detail & history
  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchMessages();
      setUnreadCount(0);
    } else if (activeTab === 'resources') {
      fetchResources();
    }
  }, [activeTab, id]);

  // Handle Socket.io registration & listeners
  useEffect(() => {
    if (!socket || !id) return;

    // Join room
    socket.emit('joinRoom', id);

    // Listen for new messages
    socket.on('receiveMessage', (message) => {
      if (message.groupId === id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        if (activeTab !== 'chat') {
          setUnreadCount((prev) => prev + 1);
        }
      }
    });

    // Listen for typing indicator
    socket.on('typing', (data) => {
      const { username, isTyping } = data;
      if (isTyping) {
        setTypingUsers((prev) => [...new Set([...prev, username])]);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== username));
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('typing');
    };
  }, [socket, id, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const data = await groupsAPI.getDetails(id);
      setGroup(data);
    } catch (err) {
      console.error('Error loading group:', err);
      alert(err.message || 'Group not found or access denied');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setChatLoading(true);
    try {
      const data = await messagesAPI.getMessages(id);
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const data = await resourcesAPI.getResources(id);
      setResources(data);
    } catch (err) {
      console.error('Error loading resources:', err);
    }
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this study group?')) return;
    try {
      await groupsAPI.leave(id);
      await refreshUser();
      navigate('/');
    } catch (err) {
      console.error('Leave group error:', err);
      alert(err.message || 'Failed to leave group');
    }
  };

  // Chat message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() && !chatFile) return;

    // Handle File upload via REST
    if (chatFile) {
      const formData = new FormData();
      formData.append('content', typedMessage);
      formData.append('file', chatFile);
      if (replyingTo) {
        formData.append('replyTo', replyingTo._id);
      }
      
      try {
        setChatFile(null);
        setTypedMessage('');
        setReplyingTo(null);
        await messagesAPI.sendMessage(id, formData);
      } catch (err) {
        console.error('Error sending file message:', err);
        alert(err.message || 'Failed to send attachment');
      }
    } else {
      // Text-only sending via Sockets
      if (socket) {
        socket.emit('sendMessage', {
          groupId: id,
          senderId: user._id,
          content: typedMessage,
          replyTo: replyingTo ? replyingTo._id : null
        });
        setTypedMessage('');
        setReplyingTo(null);
        
        // Stop typing indicator
        socket.emit('typing', { groupId: id, username: user.name, isTyping: false });
        setIsTyping(false);
      }
    }
  };

  // Typing indicator trigger
  const handleTypingInput = (e) => {
    setTypedMessage(e.target.value);

    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { groupId: id, username: user.name, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { groupId: id, username: user.name, isTyping: false });
      setIsTyping(false);
    }, 2000);
  };

  // Add Resource
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resTitle || !resType) return;

    const formData = new FormData();
    formData.append('title', resTitle);
    formData.append('type', resType);
    formData.append('tags', resTags);

    if (resType === 'link') {
      formData.append('link', resLink);
    } else {
      if (!resFile) return alert('Please upload a file');
      formData.append('file', resFile);
    }

    try {
      setResLoading(true);
      await resourcesAPI.addResource(id, formData);
      setShowResModal(false);
      setResTitle('');
      setResLink('');
      setResTags('');
      setResFile(null);
      fetchResources();
    } catch (err) {
      console.error('Error adding resource:', err);
      alert(err.message || 'Failed to add resource');
    } finally {
      setResLoading(false);
    }
  };

  // Toggle Like Resource
  const handleToggleLike = async (resId) => {
    try {
      const data = await resourcesAPI.likeResource(resId);
      setResources((prev) => prev.map((r) => r._id === resId ? data : r));
    } catch (err) {
      console.error('Like resource error:', err);
    }
  };

  // Delete Resource
  const handleDeleteResource = async (resId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourcesAPI.deleteResource(resId);
      setResources((prev) => prev.filter((r) => r._id !== resId));
    } catch (err) {
      console.error('Delete resource error:', err);
      alert('Failed to delete resource');
    }
  };

  // Schedule Session
  const handleScheduleSession = async (e) => {
    e.preventDefault();
    if (!sessionTitle || !sessionStart || !sessionEnd) return;

    const start = new Date(sessionStart);
    const end = new Date(sessionEnd);
    if (end <= start) {
      alert("Session end time must be after the start time.");
      return;
    }

    try {
      setSessionLoading(true);
      await groupsAPI.scheduleSession(id, {
        title: sessionTitle,
        description: sessionDesc,
        startTime: sessionStart,
        endTime: sessionEnd
      });
      setShowSessionModal(false);
      setSessionTitle('');
      setSessionDesc('');
      setSessionStart('');
      setSessionEnd('');
      fetchGroupDetails();
    } catch (err) {
      console.error('Schedule session error:', err);
      alert(err.message || 'Failed to schedule session');
    } finally {
      setSessionLoading(false);
    }
  };

  // RSVP Session
  const handleSessionRSVP = async (sessionId) => {
    try {
      const data = await groupsAPI.attendSession(id, sessionId);
      setGroup((prev) => {
        const updatedSessions = prev.sessions.map((s) => s._id === sessionId ? data : s);
        return { ...prev, sessions: updatedSessions };
      });
    } catch (err) {
      console.error('RSVP session error:', err);
    }
  };

  const handleTriggerReply = (msg) => {
    setReplyingTo(msg);
  };

  const handleSelectEmoji = (emoji) => {
    setTypedMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const parseMessageContent = (msg) => {
    if (msg.replyTo) {
      const replySender = msg.replyTo.sender?._id === user._id || msg.replyTo.sender === user._id 
        ? 'You' 
        : (msg.replyTo.sender?.name || 'User');
      return (
        <div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderLeft: '3px solid var(--primary)',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            marginBottom: '8px',
            color: 'var(--text-secondary)',
            fontStyle: 'italic'
          }}>
            Replying to @{replySender}: "{msg.replyTo.content}"
          </div>
          <div>{msg.content}</div>
        </div>
      );
    }
    return <div>{msg.content}</div>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', minHeight: '80vh', alignItems: 'center' }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!group) return null;

  // Filter resources based on search in UI
  const filteredResources = resources.filter((res) => {
    const term = resSearch.toLowerCase();
    return (
      res.title.toLowerCase().includes(term) ||
      res.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  // Render Date Separated Messages
  const renderMessages = () => {
    let lastDateStr = '';
    return messages.map((msg) => {
      const isMe = msg.sender?._id === user._id || msg.sender === user._id;
      const senderName = isMe ? 'You' : (msg.sender?.name || 'User');
      const displayName = isMe ? user.name : (msg.sender?.name || 'User');
      const senderAvatar = isMe ? user.avatar : msg.sender?.avatar;
      
      const msgDate = new Date(msg.timestamp);
      const dateStr = msgDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      let showSeparator = false;
      if (dateStr !== lastDateStr) {
        showSeparator = true;
        lastDateStr = dateStr;
      }

      return (
        <React.Fragment key={msg._id}>
          {showSeparator && (
            <div style={{
              textAlign: 'center',
              margin: '24px 0 12px 0',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'var(--border-color)', zIndex: 1 }} />
              <span style={{ position: 'relative', background: 'var(--bg-primary)', padding: '0 12px', zIndex: 2 }}>
                {dateStr}
              </span>
            </div>
          )}
          <div className={`chat-bubble-container ${isMe ? 'me' : ''}`}>
            <Avatar src={senderAvatar} name={displayName} size="36px" className="chat-bubble-avatar" />
            <div className="chat-bubble-content">
              <span className={`chat-bubble-header ${isMe ? 'me' : ''}`}>
                {senderName} • {msgDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="chat-bubble-body">
                {parseMessageContent(msg)}
                
                {/* If chat has attachment */}
                {msg.fileUrl && (
                  <div className="chat-attachment">
                    <Paperclip size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {msg.fileName || 'Attachment'}
                    </span>
                    <a 
                      href={getFullUrl(msg.fileUrl)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="chat-attachment-link"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleTriggerReply(msg)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  cursor: 'pointer',
                  opacity: 0.7
                }}
                className="chat-reply-btn"
              >
                <CornerDownRight size={12} />
                <span>Reply</span>
              </button>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`main-content animate-fade-in ${activeTab === 'virtual' ? 'virtual-main-content' : ''}`}>
      <div className={`group-details-layout ${activeTab === 'virtual' ? 'virtual-active' : ''}`}>
        
        {/* Left Side: Group Info Sidebar */}
        {activeTab !== 'virtual' && (
          <div className="group-sidebar">
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="tag-badge" style={{ fontSize: '0.7rem' }}>{group.subject}</span>
                {group.isPrivate ? (
                  <span title="Private Group" style={{ color: 'var(--text-muted)' }}><Lock size={16} /></span>
                ) : (
                  <span title="Public Group" style={{ color: 'var(--text-muted)' }}><Globe size={16} /></span>
                )}
              </div>
              
              <h2 style={{ fontSize: '1.4rem', marginTop: '12px', fontWeight: 800 }}>{group.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px', lineBreak: 'anywhere' }}>
                {group.description || 'No description provided.'}
              </p>

              {/* Invite code (if private, or public for easy sharing) */}
              {group.inviteCode && (
                <div style={{ marginTop: '20px', background: 'rgba(6, 182, 212, 0.05)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Key size={12} />
                    <span>Invite Code</span>
                  </span>
                  <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, marginTop: '4px', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                    {group.inviteCode}
                  </p>
                </div>
              )}

              {/* Leave button */}
              <button 
                onClick={handleLeaveGroup} 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: '24px', justifyContent: 'center', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <LogOut size={16} />
                <span>Leave Group</span>
              </button>
            </div>

            {/* Members list */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
                <Users size={16} style={{ color: 'var(--primary)' }} />
                <span>Members ({group.members?.length || 0})</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {group.members?.map((member) => (
                  <div key={member._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar src={member.avatar} name={member.name} size="32px" />
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {member.name}
                        {member._id === group.admin?._id && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 600 }}>
                            Admin
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Tab Selection Panels */}
        <div className={activeTab === 'virtual' ? 'virtual-full-width' : ''}>
          {/* Tabs bar */}
          <div className="group-tabs-header">
            <button 
              className={`group-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'chat' })}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} />
                <span>Chat Room</span>
                {unreadCount > 0 && (
                  <span style={{
                    background: '#e5e5e5',
                    color: '#000',
                    fontSize: '0.65rem',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontWeight: 'bold'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
            <button 
              className={`group-tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'resources' })}
            >
              <FileText size={18} />
              <span>Resources</span>
            </button>
            <button 
              className={`group-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'sessions' })}
            >
              <Calendar size={18} />
              <span>Session Scheduler</span>
            </button>
            <button 
              className={`group-tab-btn ${activeTab === 'virtual' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'virtual' })}
            >
              <Video size={18} />
              <span>Virtual Room</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div>
            
            {/* TABS 1: CHAT ROOM */}
            {activeTab === 'chat' && (
              <div className="chat-container">
                <div className="chat-messages">
                  {chatLoading ? (
                    <div style={{ padding: '24px' }}>
                      <Skeleton variant="avatar" count={3} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '300px' }}>
                      <MessageSquare size={36} style={{ margin: '0 auto 12px auto' }} />
                      <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No messages yet.</p>
                      <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Type a message below to start the conversation!</p>
                    </div>
                  ) : (
                    renderMessages()
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Typing status bar */}
                <div className="chat-typing">
                  {typingUsers.length > 0 && (
                    <span>
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  )}
                </div>

                {/* Reply Indicator Preview */}
                {replyingTo && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 16px',
                    background: '#121212',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CornerDownRight size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>
                        Replying to <strong>@{replyingTo.sender?._id === user._id || replyingTo.sender === user._id ? 'You' : (replyingTo.sender?.name || 'User')}</strong>:{' '}
                        <span style={{ fontStyle: 'italic' }}>"{replyingTo.content.substring(0, 40)}{replyingTo.content.length > 40 ? '...' : ''}"</span>
                      </span>
                    </div>
                    <button 
                      onClick={() => setReplyingTo(null)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div style={{
                    position: 'absolute',
                    bottom: '70px',
                    right: '24px',
                    background: '#121212',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '6px',
                    zIndex: 100
                  }}>
                    {['😂', '👍', '❤️', '🎉', '🔥', '😮', '😢', '🙌', '💡', '✅'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => handleSelectEmoji(emoji)}
                        style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', padding: '4px', cursor: 'pointer' }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input area */}
                <form onSubmit={handleSendMessage} className="chat-input-area" style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <label htmlFor="chat-file-input" style={{ cursor: 'pointer', display: 'flex', color: chatFile ? 'var(--accent)' : 'var(--text-secondary)' }} title="Attach File">
                      <Paperclip size={20} />
                    </label>
                    <input
                      type="file"
                      id="chat-file-input"
                      style={{ display: 'none' }}
                      onChange={(e) => setChatFile(e.target.files[0])}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder={chatFile ? `File: ${chatFile.name} (Press send to upload)` : "Type a message..."}
                    className="form-input"
                    style={{ flex: 1 }}
                    value={typedMessage}
                    onChange={handleTypingInput}
                  />

                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
                    title="Insert Emoji"
                  >
                    <Smile size={20} />
                  </button>

                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* TABS 2: RESOURCES */}
            {activeTab === 'resources' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search shared resources by title or tags..."
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      value={resSearch}
                      onChange={(e) => setResSearch(e.target.value)}
                    />
                  </div>
                  
                  <button onClick={() => setShowResModal(true)} className="btn btn-primary">
                    <Plus size={18} />
                    <span>Upload Resource</span>
                  </button>
                </div>

                {filteredResources.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <FileText size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                    <p>No resources found.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Click "Upload Resource" above to share a PDF, notes, or web links!</p>
                  </div>
                ) : (
                  <div className="resources-grid">
                    {filteredResources.map((res) => {
                      const userLiked = res.likes?.includes(user._id);
                      const isOwner = res.uploadedBy?._id === user._id || res.uploadedBy === user._id;
                      const isAdmin = group.admin?._id === user._id;
                      return (
                        <div key={res._id} className="resource-card">
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span className="resource-title">{res.title}</span>
                              <span className="tag-badge-accent" style={{ fontSize: '0.7rem' }}>{res.type}</span>
                            </div>
                            
                            <p className="resource-meta">
                              Uploaded by {res.uploadedBy?.name || 'User'} on{' '}
                              {new Date(res.createdAt).toLocaleDateString()}
                            </p>

                            <div className="resource-tags">
                              {res.tags?.map((tag, idx) => (
                                <span key={idx} className="tag-badge" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="resource-footer">
                            <button 
                              onClick={() => handleToggleLike(res._id)} 
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                color: userLiked ? 'var(--primary-light)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.85rem'
                              }}
                            >
                              <ThumbsUp size={14} fill={userLiked ? 'var(--primary)' : 'none'} />
                              <span>{res.likes?.length || 0} Likes</span>
                            </button>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              {(isOwner || isAdmin) && (
                                <button 
                                  onClick={() => handleDeleteResource(res._id)} 
                                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                                  title="Delete resource"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              
                              <a 
                                href={getFullUrl(res.fileUrl)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                              >
                                {res.type === 'link' ? (
                                  <>
                                    <span>Visit Link</span>
                                    <ExternalLink size={12} />
                                  </>
                                ) : (
                                  <>
                                    <span>Download</span>
                                    <Download size={12} />
                                  </>
                                )}
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TABS 3: SESSION SCHEDULER */}
            {activeTab === 'sessions' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>Scheduled Study Sessions</h3>
                  <button onClick={() => setShowSessionModal(true)} className="btn btn-primary">
                    <Plus size={18} />
                    <span>Schedule Session</span>
                  </button>
                </div>

                {group.sessions?.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Calendar size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                    <p>No study sessions scheduled yet.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Plan an upcoming study meetup with your team!</p>
                  </div>
                ) : (
                  <div className="sessions-list">
                    {[...group.sessions]
                      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                      .map((session) => {
                        const start = new Date(session.startTime);
                        const end = new Date(session.endTime);
                        const userAttending = session.attendees?.includes(user._id);
                        return (
                          <div key={session._id} className="session-card">
                            <div>
                              <div className="session-time">
                                <Clock size={14} />
                                <span>
                                  {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} |{' '}
                                  {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} -{' '}
                                  {end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="session-title">{session.title}</span>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                                {session.description || 'No description provided.'}
                              </p>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                                {session.attendees?.length || 0} student(s) attending
                              </p>
                            </div>

                            <button 
                              onClick={() => handleSessionRSVP(session._id)}
                              className={`btn ${userAttending ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ padding: '8px 16px', fontSize: '0.85rem', height: 'fit-content' }}
                            >
                              {userAttending ? 'Cancel RSVP' : 'RSVP (Attend)'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* TABS 4: VIRTUAL ROOM */}
            {activeTab === 'virtual' && (
              <VirtualRoom 
                group={group} 
                currentStudent={{ id: user._id, name: user.name, avatar: getFullUrl(user.avatar) }} 
                allStudents={group.members.map(m => ({ id: m._id, name: m.name, avatar: getFullUrl(m.avatar) }))} 
                socket={socket} 
              />
            )}

          </div>
        </div>

      </div>

      {/* Upload Resource Modal */}
      {showResModal && (
        <div className="modal-overlay" onClick={() => setShowResModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Upload Group Resource</h3>
              <button onClick={() => setShowResModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddResource}>
              <div className="form-group">
                <label className="form-label">Resource Title</label>
                <input
                  type="text"
                  placeholder="e.g. Physics Cheat Sheet, Lecture 3 Notes"
                  className="form-input"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resource Type</label>
                <select 
                  className="form-input"
                  value={resType}
                  onChange={(e) => setResType(e.target.value)}
                >
                  <option value="pdf">PDF File</option>
                  <option value="image">Image File</option>
                  <option value="doc">Document File</option>
                  <option value="link">Web URL Link</option>
                </select>
              </div>

              {resType === 'link' ? (
                <div className="form-group">
                  <label className="form-label">Web URL Link</label>
                  <input
                    type="url"
                    placeholder="https://example.com/useful-study-source"
                    className="form-input"
                    value={resLink}
                    onChange={(e) => setResLink(e.target.value)}
                    required={resType === 'link'}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Upload File</label>
                  <input
                    type="file"
                    className="form-input"
                    onChange={(e) => setResFile(e.target.files[0])}
                    required={resType !== 'link'}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="midterm, physics, notes"
                  className="form-input"
                  value={resTags}
                  onChange={(e) => setResTags(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowResModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={resLoading}>
                  {resLoading ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Share Resource</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {showSessionModal && (
        <div className="modal-overlay" onClick={() => setShowSessionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Schedule Study Session</h3>
              <button onClick={() => setShowSessionModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleSession}>
              <div className="form-group">
                <label className="form-label">Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 Practice Problems"
                  className="form-input"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Topics</label>
                <textarea
                  placeholder="Write topics to cover, Zoom link, or guidelines..."
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={sessionDesc}
                  onChange={(e) => setSessionDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={sessionStart}
                  onChange={(e) => setSessionStart(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={sessionEnd}
                  onChange={(e) => setSessionEnd(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowSessionModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={sessionLoading}>
                  {sessionLoading ? (
                    <>
                      <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <span>Schedule</span>
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

export default GroupDetailsPage;
