const Group = require('../models/Group');
const User = require('../models/User');

// Helper function to generate invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Get all public groups
// @route   GET /api/groups
// @access  Private (Logged in user can browse)
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isPrivate: false })
      .populate('admin', 'name email avatar')
      .populate('members', 'name email avatar');
    res.status(200).json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error retrieving groups' });
  }
};

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  const { name, description, subject, isPrivate } = req.body;

  if (!name || !subject) {
    return res.status(400).json({ message: 'Name and subject are required' });
  }

  try {
    const inviteCode = isPrivate === true || isPrivate === 'true' ? generateInviteCode() : undefined;

    const group = await Group.create({
      name,
      description,
      subject,
      admin: req.user.id,
      members: [req.user.id],
      isPrivate: isPrivate === true || isPrivate === 'true',
      inviteCode,
      sessions: [],
      resources: []
    });

    // Update user's joined groups
    await User.findByIdAndUpdate(req.user.id, {
      $push: { groupsJoined: group._id }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error creating group' });
  }
};

// @desc    Get group details by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate({
        path: 'resources',
        populate: {
          path: 'uploadedBy',
          select: 'name email avatar'
        }
      });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // If private group, check if request user is a member or admin
    if (group.isPrivate) {
      const isMember = group.members.some(member => member._id.toString() === req.user.id);
      if (!isMember && group.admin._id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: private group membership required' });
      }
    }

    res.status(200).json(group);
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ message: 'Server error retrieving group details' });
  }
};

// @desc    Join a group by ID (public) or invite code (private/public)
// @route   POST /api/groups/join
// @access  Private
const joinGroup = async (req, res) => {
  const { groupId, inviteCode } = req.body;

  try {
    let group;

    if (inviteCode) {
      group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
      if (!group) {
        return res.status(404).json({ message: 'Invalid invite code' });
      }
    } else if (groupId) {
      group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      if (group.isPrivate) {
        return res.status(400).json({ message: 'Invite code required to join private groups' });
      }
    } else {
      return res.status(400).json({ message: 'Group ID or Invite Code is required' });
    }

    // Check if user is already a member
    const isMember = group.members.some(memberId => memberId.toString() === req.user.id);
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add member to group
    group.members.push(req.user.id);
    await group.save();

    // Add group to user's joined groups
    await User.findByIdAndUpdate(req.user.id, {
      $push: { groupsJoined: group._id }
    });

    res.status(200).json({ message: 'Joined group successfully', group });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error joining group' });
  }
};

// @desc    Leave a group
// @route   DELETE /api/groups/:id/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    const isMember = group.members.some(memberId => memberId.toString() === req.user.id);
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    // Prevent admin from leaving unless they are the only member
    if (group.admin.toString() === req.user.id && group.members.length > 1) {
      return res.status(400).json({ message: 'Admin cannot leave the group. Please appoint another admin or delete the group.' });
    }

    // Remove member from group
    group.members = group.members.filter(memberId => memberId.toString() !== req.user.id);
    
    // If no members left, delete the group entirely
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(req.params.id);
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { groupsJoined: req.params.id }
      });
      return res.status(200).json({ message: 'Left and deleted group (no members remaining)' });
    }

    await group.save();

    // Remove group from user's joined list
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { groupsJoined: req.params.id }
    });

    res.status(200).json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error leaving group' });
  }
};

// @desc    Schedule a study session for a group
// @route   POST /api/groups/:id/sessions
// @access  Private (Admin or Member)
const createSession = async (req, res) => {
  const { title, description, startTime, endTime } = req.body;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ message: 'Title, start time, and end time are required' });
  }

  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user is member or admin
    const isMember = group.members.some(memberId => memberId.toString() === req.user.id);
    if (!isMember && group.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to schedule sessions in this group' });
    }

    const session = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees: [req.user.id] // Creator attends by default
    };

    group.sessions.push(session);
    await group.save();

    res.status(201).json(group.sessions[group.sessions.length - 1]);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error scheduling session' });
  }
};

// @desc    Toggle session attendance
// @route   POST /api/groups/:id/sessions/:sessionId/attend
// @access  Private
const attendSession = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const session = group.sessions.id(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if already attending
    const attendeeIndex = session.attendees.findIndex(attendeeId => attendeeId.toString() === req.user.id);
    if (attendeeIndex > -1) {
      // Remove attendance
      session.attendees.splice(attendeeIndex, 1);
    } else {
      // Add attendance
      session.attendees.push(req.user.id);
    }

    await group.save();
    res.status(200).json(session);
  } catch (error) {
    console.error('Attend session error:', error);
    res.status(500).json({ message: 'Server error updating session attendance' });
  }
};

module.exports = {
  getGroups,
  createGroup,
  getGroupById,
  joinGroup,
  leaveGroup,
  createSession,
  attendSession
};
