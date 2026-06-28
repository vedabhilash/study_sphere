const Message = require('../models/Message');
const User = require('../models/User');

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User logs in / goes online
    socket.on('userOnline', async (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        
        // Broadcast presence update
        io.emit('userStatusUpdate', {
          userId,
          status: 'online'
        });
      }
    });

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
      }
    });
  });
};

module.exports = { socketHandler, onlineUsers };
