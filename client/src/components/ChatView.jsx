import React from 'react';
import { Send, User } from 'lucide-react';

export default function ChatView({ group, currentStudent, allStudents, onSendMessage }) {
  const [inputText, setInputText] = React.useState('');
  const [typingUser, setTypingUser] = React.useState(null);
  const scrollRef = React.useRef(null);

  // Auto-scroll chat to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [group.messages, typingUser]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = {
      id: `m-user-${Date.now()}`,
      senderId: currentStudent.id,
      senderName: currentStudent.name,
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onSendMessage(group.id, userMessage);
    const sentText = inputText;
    setInputText('');

    // Simulated Auto-Response
    triggerSimulatedResponse(sentText);
  };

  const triggerSimulatedResponse = (text) => {
    // Find group members other than current student
    const otherMemberIds = group.members.filter(id => id !== currentStudent.id);
    if (otherMemberIds.length === 0) return;

    // Pick a random other member
    const randomMemberId = otherMemberIds[Math.floor(Math.random() * otherMemberIds.length)];
    const sender = allStudents.find(s => s.id === randomMemberId) || { name: 'Study Buddy' };

    // Select response based on course and user text
    let responseText = `Hey! Let's talk more about this in our upcoming virtual session.`;
    
    const lowerText = text.toLowerCase();
    if (lowerText.includes('help') || lowerText.includes('stuck') || lowerText.includes('question') || lowerText.includes('solve')) {
      responseText = `I can help with that! I worked through similar problems yesterday. Shall we open the Virtual Whiteboard?`;
    } else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
      responseText = `Hey there! Excited to study together for ${group.course.split(':')[0]}.`;
    } else if (lowerText.includes('notes') || lowerText.includes('cheat') || lowerText.includes('resource') || lowerText.includes('sheet')) {
      responseText = `Good point, I think there are some great notes in our Resources tab! Let's check there.`;
    } else if (lowerText.includes('time') || lowerText.includes('calendar') || lowerText.includes('schedule') || lowerText.includes('meet')) {
      responseText = `Check the group Calendar. I updated my availability. Make sure to propose a slot that fits everyone!`;
    } else {
      // General contextual replies
      const defaultReplies = [
        `That makes sense to me. Let's make sure we review that before the test.`,
        `I am focusing on that chapter today too. It's quite tricky.`,
        `Agreed! Let's add that as one of our Group Goals in the tracker.`,
        `Does anyone have a practice problem we can solve for this?`
      ];
      responseText = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
    }

    // Trigger typing simulator
    setTimeout(() => {
      setTypingUser(sender.name);
      
      setTimeout(() => {
        setTypingUser(null);
        
        const botMessage = {
          id: `m-bot-${Date.now()}`,
          senderId: sender.id,
          senderName: sender.name,
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        onSendMessage(group.id, botMessage);
      }, 1500); // Typing duration
    }, 1000); // Delay before starting to type
  };

  // Group members profile list
  const memberList = group.members.map(id => {
    return allStudents.find(s => s.id === id) || { id, name: 'Unknown User', avatar: '?', major: 'Unknown' };
  });

  return (
    <div className="chat-container">
      {/* Chat Messages Log */}
      <div className="chat-messages-area">
        <div className="chat-scroll" ref={scrollRef}>
          {group.messages.map(msg => {
            const isUser = msg.senderId === currentStudent.id;
            const isSystem = msg.senderId === 'system';
            
            if (isSystem) {
              return (
                <div 
                  key={msg.id} 
                  style={{ 
                    textAlign: 'center', 
                    margin: '0.5rem 0', 
                    fontSize: '0.8rem', 
                    color: 'var(--primary)',
                    background: 'rgba(99, 102, 241, 0.05)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(99, 102, 241, 0.1)'
                  }}
                >
                  {msg.content}
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                className={`chat-bubble ${isUser ? 'outgoing' : 'incoming'}`}
              >
                {!isUser && <span className="msg-sender">{msg.senderName}</span>}
                <span className="msg-text">{msg.content}</span>
                <span className="msg-time">{msg.timestamp}</span>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {typingUser && (
            <div className="chat-bubble incoming" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              <span className="msg-sender" style={{ fontStyle: 'normal' }}>{typingUser}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                is typing
                <span className="typing-dots" style={{ display: 'inline-flex', gap: '2px' }}>
                  <span style={{ animation: 'bounce 1s infinite', animationDelay: '0s' }}>.</span>
                  <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.2s' }}>.</span>
                  <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.4s' }}>.</span>
                </span>
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="chat-input-bar">
          <input 
            type="text" 
            placeholder="Type a message to your study group..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="form-input"
          />
          <button type="submit" className="btn btn-primary">
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Chat Sidebar Members */}
      <div className="chat-sidebar-members">
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Members ({memberList.length})
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {memberList.map(member => {
            // Check if user is current student (always online) or mock online status (let's say s1, s2, s3 online)
            const isOnline = member.id === currentStudent.id || ['s1', 's2', 's3'].includes(member.id);
            return (
              <div key={member.id} className="member-row">
                <span className={`status-dot ${isOnline ? 'online' : ''}`} />
                <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '0.65rem' }}>
                  {member.avatar || 'SB'}
                </div>
                <span style={{ 
                  textOverflow: 'ellipsis', 
                  overflow: 'hidden', 
                  whiteSpace: 'nowrap',
                  fontWeight: member.id === currentStudent.id ? '600' : 'normal'
                }}>
                  {member.name} {member.id === currentStudent.id && '(You)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
