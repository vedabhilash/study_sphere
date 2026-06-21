import express from 'express';
import { verifyToken } from './auth.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

const router = express.Router();

// Helper to map mongoose group _ids to id for frontend compatibility
function formatGroup(group) {
  const gObj = group.toObject ? group.toObject() : group;
  gObj.id = gObj._id;
  if (gObj.goals) gObj.goals.forEach(g => g.id = g._id);
  if (gObj.meetings) gObj.meetings.forEach(m => m.id = m._id);
  if (gObj.resources) gObj.resources.forEach(r => r.id = r._id);
  if (gObj.messages) gObj.messages.forEach(m => m.id = m._id);
  return gObj;
}

// @route   GET /api/groups
// @desc    Get all study groups
router.get('/', verifyToken, async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups.map(formatGroup));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving groups' });
  }
});

// @route   POST /api/groups
// @desc    Create a new study group
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, course, description, maxSize, studyStyle } = req.body;

    if (!name || !course) {
      return res.status(400).json({ message: 'Name and course are required fields' });
    }

    const newGroup = new Group({
      name,
      course,
      description,
      maxSize,
      studyStyle,
      members: [req.userId],
      goals: [],
      meetings: [],
      resources: [],
      messages: [
        {
          senderId: 'system',
          senderName: 'System',
          content: `Welcome to the newly created group: ${name}! Set goals, schedule calls, or upload resources to get started.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });

    const saved = await newGroup.save();
    res.status(201).json(formatGroup(saved));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating study group' });
  }
});

// @route   POST /api/groups/:id/join
// @desc    Join a study group
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.members.includes(req.userId)) {
      return res.status(400).json({ message: 'You are already a member' });
    }

    if (group.members.length >= group.maxSize) {
      return res.status(400).json({ message: 'Group is full' });
    }

    const user = await User.findById(req.userId);
    const userName = user ? user.name : 'A student';

    group.members.push(req.userId);
    group.messages.push({
      senderId: 'system',
      senderName: 'System',
      content: `${userName} joined the workspace.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error joining group' });
  }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave a study group
router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.includes(req.userId)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    const user = await User.findById(req.userId);
    const userName = user ? user.name : 'A student';

    group.members = group.members.filter(id => id.toString() !== req.userId);
    group.messages.push({
      senderId: 'system',
      senderName: 'System',
      content: `${userName} left the workspace.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error leaving group' });
  }
});

// @route   POST /api/groups/:id/invite
// @desc    Invite a peer student to join
router.post('/:id/invite', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.members.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already a member' });
    }

    const invitedUser = await User.findById(studentId);
    if (!invitedUser) return res.status(404).json({ message: 'Student profile not found' });

    group.members.push(studentId);
    group.messages.push({
      senderId: 'system',
      senderName: 'System',
      content: `${invitedUser.name} was invited and joined the workspace.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during invitation' });
  }
});

// @route   POST /api/groups/:id/meetings
// @desc    Schedule a new study session
router.post('/:id/meetings', verifyToken, async (req, res) => {
  try {
    const { title, date, time, duration } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const meeting = {
      title,
      date,
      time,
      duration,
      location: 'Virtual Room',
      attendees: group.members
    };

    group.meetings.push(meeting);
    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.status(201).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error scheduling session' });
  }
});

// @route   POST /api/groups/:id/resources
// @desc    Add a shared study resource
router.post('/:id/resources', verifyToken, async (req, res) => {
  try {
    const { title, type, content, category } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const user = await User.findById(req.userId);
    const userName = user ? user.name : 'Unknown';

    const resource = {
      title,
      type,
      content,
      postedBy: userName,
      upvotes: 0,
      category
    };

    group.resources.push(resource);
    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.status(201).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding resource' });
  }
});

// @route   POST /api/groups/:id/resources/:resId/upvote
// @desc    Upvote a shared resource
router.post('/:id/resources/:resId/upvote', verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const resource = group.resources.id(req.params.resId);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    resource.upvotes += 1;
    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error upvoting resource' });
  }
});

// @route   POST /api/groups/:id/goals
// @desc    Create a study goal objective
router.post('/:id/goals', verifyToken, async (req, res) => {
  try {
    const { title, subtasks } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const goal = {
      title,
      completed: false,
      subtasks: subtasks || []
    };

    group.goals.push(goal);
    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.status(201).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding study goal' });
  }
});

// @route   POST /api/groups/:id/goals/:goalId/subtasks/:subId/toggle
// @desc    Toggle subtask completed status
router.post('/:id/goals/:goalId/subtasks/:subId/toggle', verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const goal = group.goals.id(req.params.goalId);
    if (!goal) return res.status(404).json({ message: 'Goal objective not found' });

    const subtask = goal.subtasks.id(req.params.subId);
    if (!subtask) return res.status(404).json({ message: 'Checklist item not found' });

    subtask.completed = !subtask.completed;
    
    // Recalculate main goal completed status
    goal.completed = goal.subtasks.every(s => s.completed);

    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error toggling subtask' });
  }
});

// @route   DELETE /api/groups/:id/goals/:goalId
// @desc    Delete a study goal objective
router.delete('/:id/goals/:goalId', verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.goals = group.goals.filter(goal => goal._id.toString() !== req.params.goalId);
    const saved = await group.save();
    const formatted = formatGroup(saved);
    const io = req.app.get('socketio');
    if (io) {
      io.to(group._id.toString()).emit('groupUpdated', formatted);
    }
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting goal' });
  }
});

export default router;
