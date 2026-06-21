import Group from '../models/Group.js';

export default function configureSockets(io) {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join group study workspace channel
    socket.on('joinGroup', ({ groupId }) => {
      socket.join(groupId);
      console.log(`Client ${socket.id} joined group room: ${groupId}`);
    });

    // Leave group study workspace channel
    socket.on('leaveGroup', ({ groupId }) => {
      socket.leave(groupId);
      console.log(`Client ${socket.id} left group room: ${groupId}`);
    });

    // Broadcast messages in group chat room & save to DB
    socket.on('sendMessage', async ({ groupId, message }) => {
      try {
        const group = await Group.findById(groupId);
        if (group) {
          group.messages.push({
            senderId: message.senderId,
            senderName: message.senderName,
            content: message.content,
            timestamp: message.timestamp
          });
          const saved = await group.save();
          const addedMsg = saved.messages[saved.messages.length - 1];
          const formattedMsg = {
            id: addedMsg._id,
            senderId: addedMsg.senderId,
            senderName: addedMsg.senderName,
            content: addedMsg.content,
            timestamp: addedMsg.timestamp
          };

          // Broadcast to everyone in the room (including sender to get official ID)
          io.to(groupId).emit('messageReceived', { groupId, message: formattedMsg });
        }
      } catch (error) {
        console.error('Error saving socket message:', error);
      }
    });

    // Relay whiteboard draw strokes
    socket.on('draw', ({ groupId, strokeData }) => {
      // Broadcast to other users in the group room
      socket.to(groupId).emit('incomingDraw', strokeData);
    });

    // Clear whiteboard request
    socket.on('clearBoard', ({ groupId }) => {
      socket.to(groupId).emit('incomingClearBoard');
    });

    // Register the user to their own personal room for notifications/DMs
    socket.on('registerUser', ({ userId }) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} registered to room user-${userId}`);
    });

    socket.on('sendDirectMessage', ({ receiverId, message }) => {
      // Send directly to the receiver's personal room
      io.to(`user-${receiverId}`).emit('incomingDirectMessage', message);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
}
