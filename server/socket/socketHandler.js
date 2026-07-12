const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

const socketHandler = (io) => {
  // Authentication middleware for Socket.IO handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforstudygroupapp');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected (Secure): ${socket.id}`);

    // Register user as online immediately
    const userId = socket.userId;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      
      // Broadcast presence update
      io.emit('userStatusUpdate', {
        userId,
        status: 'online'
      });
    }

    // Join a group study room
    socket.on('joinRoom', (groupId) => {
      if (groupId) {
        socket.join(groupId);
        console.log(`Socket ${socket.id} joined room: ${groupId}`);
      }
    });

    // Send a real-time message (Text-only)
    socket.on('sendMessage', async (messageData) => {
      const { groupId, senderId, content } = messageData;

      if (!groupId || !senderId || !content) return;

      try {
        const message = await Message.create({
          groupId,
          sender: senderId,
          content,
          fileUrl: '',
          fileName: ''
        });

        const populatedMessage = await message.populate('sender', 'name email avatar');

        // Broadcast to all clients in the group room
        io.to(groupId).emit('receiveMessage', populatedMessage);
      } catch (error) {
        console.error('Socket message save error:', error);
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      const { groupId, username, isTyping } = data;
      if (groupId && username) {
        // Broadcast to everyone in the room except sender
        socket.to(groupId).emit('typing', { username, isTyping });
      }
    });

    // WebRTC signaling for peer-to-peer video calls
    // Use room-based delivery (io.to(targetId)) instead of a socket-ID
    // lookup so signals are never silently dropped due to race conditions
    // or reconnections.
    socket.on('videoCallSignal', ({ targetId, signal, senderId }) => {
      io.to(targetId).emit('incomingVideoCallSignal', { senderId, signal });
    });

    // User joins meeting room
    socket.on('joinMeeting', ({ groupId, student }) => {
      if (student && student.id) {
        socket.join(student.id);
        onlineUsers.set(student.id, socket.id);
        socket.userId = student.id;
      }
      socket.join(`${groupId}-meeting`);
      socket.to(`${groupId}-meeting`).emit('meetingUserJoined', student);
      console.log(`Meeting: ${student.name} joined room ${groupId}-meeting`);
    });

    // User leaves meeting room
    socket.on('leaveMeeting', ({ groupId, studentId }) => {
      socket.leave(`${groupId}-meeting`);
      socket.to(`${groupId}-meeting`).emit('meetingUserLeft', studentId);
      console.log(`Meeting: ${studentId} left room ${groupId}-meeting`);
    });

    // Broadcast status updates (camera, microphone, speaking, raised hand)
    socket.on('meetingStatusUpdate', ({ groupId, studentId, status }) => {
      socket.to(`${groupId}-meeting`).emit('meetingStatusUpdate', { studentId, status });
    });

    // Relay emoji reactions
    socket.on('sendEmojiReaction', ({ groupId, studentId, emoji }) => {
      io.to(`${groupId}-meeting`).emit('incomingEmojiReaction', { studentId, emoji });
    });

    // Send in-meeting message
    socket.on('sendMeetingMessage', ({ groupId, message }) => {
      io.to(`${groupId}-meeting`).emit('receiveMeetingMessage', message);
    });

    // Relay whiteboard draw strokes
    socket.on('draw', ({ groupId, strokeData }) => {
      if (groupId) {
        socket.to(groupId).emit('incomingDraw', strokeData);
      }
    });

    // Clear whiteboard request
    socket.on('clearBoard', ({ groupId }) => {
      if (groupId) {
        socket.to(groupId).emit('incomingClearBoard');
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        
        // Broadcast presence update
        io.emit('userStatusUpdate', {
          userId: socket.userId,
          status: 'offline'
        });

        // Broadcast offline status to active meetings
        io.emit('meetingUserOffline', socket.userId);
      }
    });
  });
};

module.exports = { socketHandler, onlineUsers };
