const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getSortedMatches } = require('../utils/matchingAlgorithm');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforstudygroupapp', {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate random avatar background/color if none provided
    const colors = ['#4f46e5', '#0891b2', '#0d9488', '#ea580c', '#db2777', '#7c3aed'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor.replace('#', '')}&color=fff`;

    // Create user
    const user = await User.create({
      name,
      email,
      password, // Password hashed by User pre-save hook
      avatar,
      groupsJoined: []
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please include email and password' });
  }

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'groupsJoined',
      populate: [
        { path: 'members', select: 'name email avatar' },
        { path: 'sessions' }
      ]
    });
    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields from body if provided
    const fieldsToUpdate = [
      'name',
      'academicMajor',
      'yearOfStudy',
      'university',
      'bio',
      'courses',
      'preferredGroupSize',
      'preferredStudyStyle',
      'learningGoals',
      'weeklyAvailability',
      'privacy',
      'avatar'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    // Populate user and send back
    const updatedUser = await User.findById(user._id).populate({
      path: 'groupsJoined',
      populate: [
        { path: 'members', select: 'name email avatar' },
        { path: 'sessions' }
      ]
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Upload avatar
// @route   POST /api/auth/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set avatar path to the relative upload URL
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({ avatar: user.avatar });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error uploading avatar' });
  }
};

// @desc    Get study matches for the current user
const getMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all other users
    const allUsers = await User.find({ _id: { $ne: req.user.id } });
    
    // Sort matches
    const sortedMatches = getSortedMatches(currentUser, allUsers);
    
    res.status(200).json(sortedMatches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error calculating matches' });
  }
};

// @desc    Seed mock matching users and align current user profile (production friendly)
const seedMatchesProduction = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Clear existing seed users in production DB
    await User.deleteMany({ email: { $in: ['alice@collabstudy.edu', 'bob@collabstudy.edu', 'clara@collabstudy.edu'] } });

    // 2. Create seed users
    const seedUsers = [
      {
        name: 'Alice Vance',
        email: 'alice@collabstudy.edu',
        password: hashedPassword,
        avatar: '',
        academicMajor: 'Computer Science',
        yearOfStudy: '2',
        university: 'CollabStudy University',
        bio: 'Coding enthusiast. Love building React web apps and playing tennis.',
        courses: ['CS 101: Introduction to Programming', 'CS 102: Data Structures', 'MATH 201: Calculus'],
        skillsCanTeach: [
          { name: 'React', category: 'Programming', level: 'Advanced' },
          { name: 'Design', category: 'Design', level: 'Intermediate' }
        ],
        skillsToLearn: [
          { name: 'Python', category: 'Programming', priority: 'High' },
          { name: 'Calculus', category: 'Mathematics', priority: 'Medium' }
        ],
        weeklyAvailability: {
          monday: ['Afternoon'],
          wednesday: ['Morning'],
          friday: ['Afternoon']
        },
        preferredStudyStyle: 'discussion',
        learningGoals: ['Master React Hooks', 'A grade in Calculus', 'Build full-stack side projects']
      },
      {
        name: 'Bob Smith',
        email: 'bob@collabstudy.edu',
        password: hashedPassword,
        avatar: '',
        academicMajor: 'Computer Science',
        yearOfStudy: '3',
        university: 'CollabStudy University',
        bio: 'Focusing on algorithmic problem solving. Prefer visual notes.',
        courses: ['CS 102: Data Structures'],
        skillsCanTeach: [
          { name: 'Python', category: 'Programming', level: 'Expert' },
          { name: 'Data Structures', category: 'Programming', level: 'Expert' }
        ],
        skillsToLearn: [
          { name: 'React', category: 'Programming', priority: 'High' },
          { name: 'Calculus', category: 'Mathematics', priority: 'Low' }
        ],
        weeklyAvailability: {
          monday: ['Morning', 'Afternoon'],
          tuesday: ['Afternoon'],
          thursday: ['Morning']
        },
        preferredStudyStyle: 'visual',
        learningGoals: ['Understand Graph algorithms', 'Contribute to open source']
      },
      {
        name: 'Clara Jones',
        email: 'clara@collabstudy.edu',
        password: hashedPassword,
        avatar: '',
        academicMajor: 'Mathematics',
        yearOfStudy: '1',
        university: 'CollabStudy University',
        bio: 'First year math student. Looking for intensive study sessions.',
        courses: ['MATH 201: Calculus'],
        skillsCanTeach: [
          { name: 'Calculus', category: 'Mathematics', level: 'Expert' }
        ],
        skillsToLearn: [
          { name: 'Python', category: 'Programming', priority: 'High' },
          { name: 'Design', category: 'Design', priority: 'Medium' }
        ],
        weeklyAvailability: {
          friday: ['Afternoon', 'Evening'],
          saturday: ['Morning']
        },
        preferredStudyStyle: 'intensive',
        learningGoals: ['Score high in Calculus limits', 'Learn basic Python']
      }
    ];

    const insertedUsers = await User.insertMany(seedUsers);
    const alice = insertedUsers[0];
    const bob = insertedUsers[1];
    const clara = insertedUsers[2];

    const Group = require('../models/Group');
    // Clear existing seeded groups
    await Group.deleteMany({ name: { $in: ['Algorithms & Data Structures Club', 'Calculus I & II Study Lounge'] } });

    // Seed Groups
    const nextWeekStart1 = new Date();
    nextWeekStart1.setDate(nextWeekStart1.getDate() + 7);
    nextWeekStart1.setHours(14, 0, 0, 0);
    const nextWeekEnd1 = new Date(nextWeekStart1);
    nextWeekEnd1.setHours(15, 0, 0, 0);

    const currentUser = await User.findById(req.user.id);

    const group1 = await Group.create({
      name: 'Algorithms & Data Structures Club',
      description: 'Weekly practice on coding problems, graphs, sorting, and dynamic programming.',
      subject: 'Computer Science',
      admin: alice._id,
      members: [alice._id, bob._id, currentUser._id],
      isPrivate: false,
      inviteCode: 'CSALGO1',
      sessions: [
        {
          title: 'Graph Traversal & BFS/DFS',
          description: 'Interactive whiteboard session drawing out traversal tracks.',
          startTime: nextWeekStart1,
          endTime: nextWeekEnd1,
          attendees: [alice._id, bob._id, currentUser._id]
        }
      ]
    });

    const nextWeekStart2 = new Date();
    nextWeekStart2.setDate(nextWeekStart2.getDate() + 5);
    nextWeekStart2.setHours(10, 0, 0, 0);
    const nextWeekEnd2 = new Date(nextWeekStart2);
    nextWeekEnd2.setHours(12, 0, 0, 0);

    const group2 = await Group.create({
      name: 'Calculus I & II Study Lounge',
      description: 'Preparation for midterms and practice with integration by parts and limits.',
      subject: 'Mathematics',
      admin: clara._id,
      members: [clara._id, alice._id],
      isPrivate: false,
      inviteCode: 'MATHCALC',
      sessions: [
        {
          title: 'Limits & Derivatives Review',
          description: 'Reviewing practice exams.',
          startTime: nextWeekStart2,
          endTime: nextWeekEnd2,
          attendees: [clara._id, alice._id]
        }
      ]
    });

    // 3. Update current user's profile to align
    if (currentUser) {
      currentUser.academicMajor = 'Computer Science';
      currentUser.yearOfStudy = '2';
      currentUser.courses = [
        'CS 101: Introduction to Programming',
        'CS 102: Data Structures',
        'MATH 201: Calculus'
      ];
      currentUser.skillsCanTeach = [
        { name: 'React', category: 'Programming', level: 'Intermediate' },
        { name: 'Calculus', category: 'Mathematics', level: 'Intermediate' }
      ];
      currentUser.skillsToLearn = [
        { name: 'Python', category: 'Programming', priority: 'High' },
        { name: 'Design', category: 'Design', priority: 'High' }
      ];
      currentUser.weeklyAvailability = {
        monday: ['Afternoon'],
        wednesday: ['Morning'],
        friday: ['Afternoon']
      };
      currentUser.preferredStudyStyle = 'discussion';
      currentUser.learningGoals = ['Master React Hooks', 'A grade in Calculus', 'Build full-stack side projects'];
      currentUser.groupsJoined = [group1._id];
      await currentUser.save();
    }

    res.status(200).json({
      success: true,
      message: 'Successfully seeded study matches (Alice, Bob, Clara) and updated your profile in the production database!'
    });
  } catch (error) {
    console.error('Production seeding error:', error);
    res.status(500).json({ message: 'Server error during database seeding', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  uploadAvatar,
  getMatches,
  seedMatchesProduction
};
