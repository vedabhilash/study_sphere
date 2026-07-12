import React, { useState, useEffect, useRef } from 'react';
import { Send, CornerDownRight, X } from 'lucide-react';
import Avatar from './Avatar';

export default function MeetingChat({ group, socket, currentStudent, joined }) {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!socket || !joined) return;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('receiveMeetingMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMeetingMessage', handleReceiveMessage);
    };
  }, [socket, joined]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    const msg = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentStudent.id,
      senderName: currentStudent.name,
      senderAvatar: currentStudent.avatar,
      text: chatInput.trim(),
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? { text: replyingTo.text, senderName: replyingTo.senderName } : null
    };

    socket.emit('sendMeetingMessage', {
      groupId: group.id || group._id,
      message: msg
    });

    setChatInput('');
    setReplyingTo(null);
  };

  const handleTriggerReply = (msg) => {
    setReplyingTo({
      text: msg.text,
      senderName: msg.senderName
    });
  };

  return (
    <div className="meeting-chat-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', width: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Meeting Chat</h4>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} ref={scrollRef}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>No meeting messages yet.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentStudent.id;
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {/* Reply preview inside message */}
                {msg.replyTo && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderLeft: '2px solid var(--border-color)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '2px',
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    Replying to @{msg.replyTo.senderName}: "{msg.replyTo.text.substring(0, 20)}..."
                  </div>
                )}

                <div style={{
                  background: isMe ? 'var(--bg-card)' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  position: 'relative'
                }}>
                  {!isMe && (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '2px' }}>
                      {msg.senderName}
                    </span>
                  )}
                  <span style={{ fontSize: '0.85rem', color: '#fff', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <button 
                  onClick={() => handleTriggerReply(msg)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    marginTop: '2px',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    opacity: 0.8
                  }}
                >
                  <CornerDownRight size={10} />
                  <span>Reply</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          background: '#121212',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <span>Replying to <strong>@{replyingTo.senderName}</strong></span>
          <button 
            onClick={() => setReplyingTo(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} style={{ display: 'flex', padding: '12px', gap: '8px', borderTop: '1px solid var(--border-color)' }}>
        <input 
          type="text" 
          placeholder="Send message to meeting..." 
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          style={{ flex: 1, background: '#0a0a0a' }}
          className="form-input"
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
