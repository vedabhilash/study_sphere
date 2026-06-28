const Message = require('../models/Message');
const Group = require('../models/Group');

// @desc    Get all messages for a group
// @route   GET /api/groups/:id/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check membership
    const isMember = group.members.some(memberId => memberId.toString() === req.user.id);
    if (!isMember && group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view messages in this group' });
    }

    const messages = await Message.find({ groupId: req.params.id })
      .populate('sender', 'name email avatar')
      .sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error retrieving messages' });
  }
};

// @desc    Post a new message (with optional file upload)
// @route   POST /api/groups/:id/messages
// @access  Private
const createMessage = async (req, res) => {
  const { content } = req.body;
  const groupId = req.params.id;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check membership
    const isMember = group.members.some(memberId => memberId.toString() === req.user.id);
    if (!isMember && group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to send messages to this group' });
    }

    let fileUrl = '';
    let fileName = '';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    if (!content && !fileUrl) {
      return res.status(400).json({ message: 'Message content or attachment is required' });
    }

    const message = await Message.create({
      groupId,
      sender: req.user.id,
      content: content || '',
      fileUrl,
      fileName
    });

    const populatedMessage = await message.populate('sender', 'name email avatar');

    // Broadcast message via Socket.io if available
    const io = req.app.get('socketio');
    if (io) {
      io.to(groupId).emit('receiveMessage', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

module.exports = {
  getMessages,
  createMessage
};
