import express from 'express';
import { verifyToken } from './auth.js';
import User from '../models/User.js';
import { getSortedMatches } from '../utils/matchingAlgorithm.js';

const router = express.Router();

// @route   PUT /api/users/profile
// @desc    Update current student profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { 
      name, 
      avatar, 
      major, 
      bio, 
      courses, 
      availability, 
      learningGoals, 
      groupSizePreference, 
      studyStyle, 
      privacy 
    } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (major) user.major = major;
    if (bio !== undefined) user.bio = bio;
    if (courses) user.courses = courses;
    if (availability) user.availability = availability;
    if (learningGoals) user.learningGoals = learningGoals;
    if (groupSizePreference) user.groupSizePreference = groupSizePreference;
    if (studyStyle) user.studyStyle = studyStyle;
    if (privacy) user.privacy = privacy;

    const updatedUser = await user.save();
    
    // Map _id to id
    const userObj = updatedUser.toObject();
    userObj.id = userObj._id;

    res.json(userObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   GET /api/users/matches
// @desc    Get sorted compatibility list of all other students
router.get('/matches', verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all users except current
    const allUsers = await User.find({ _id: { $ne: req.userId } });

    // Calculate match scores
    const matches = getSortedMatches(currentUser, allUsers);
    
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating compatibility matches' });
  }
});

// @route   GET /api/users/list
// @desc    Get all students list
router.get('/list', verifyToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const mapped = users.map(u => {
      const uObj = u.toObject();
      uObj.id = uObj._id;
      return uObj;
    });
    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching student roster' });
  }
});

export default router;
