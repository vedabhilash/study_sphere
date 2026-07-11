const User = require('../models/User');
const SkillExchangeRequest = require('../models/SkillExchangeRequest');
const SkillSession = require('../models/SkillSession');
const SkillReview = require('../models/SkillReview');

const PRESET_SKILLS = [
  { name: 'React', category: 'Programming' },
  { name: 'Node.js', category: 'Programming' },
  { name: 'Express', category: 'Programming' },
  { name: 'MongoDB', category: 'Programming' },
  { name: 'HTML & CSS', category: 'Programming' },
  { name: 'Java', category: 'Programming' },
  { name: 'Spring Boot', category: 'Programming' },
  { name: 'Python', category: 'Programming' },
  { name: 'Machine Learning', category: 'AI' },
  { name: 'Deep Learning', category: 'AI' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Graphic Design', category: 'Design' },
  { name: 'Figma', category: 'Design' },
  { name: 'Spanish', category: 'Languages' },
  { name: 'French', category: 'Languages' },
  { name: 'German', category: 'Languages' },
  { name: 'Calculus', category: 'Mathematics' },
  { name: 'Linear Algebra', category: 'Mathematics' },
  { name: 'Finance', category: 'Business' },
  { name: 'Marketing', category: 'Business' },
  { name: 'Public Speaking', category: 'Soft Skills' },
  { name: 'Negotiation', category: 'Soft Skills' },
  { name: 'Guitar', category: 'Music' },
  { name: 'Piano', category: 'Music' },
  { name: 'Portrait Photography', category: 'Photography' }
];

// @desc    Get all available skills
// @route   GET /api/skills
// @access  Private
const getAllSkills = async (req, res) => {
  try {
    // Dynamically fetch unique skill names from other users to augment preset list
    const users = await User.find({}, 'skillsCanTeach skillsToLearn');
    const dynamicSkills = new Set();
    
    users.forEach(user => {
      user.skillsCanTeach.forEach(s => dynamicSkills.add(JSON.stringify({ name: s.name, category: s.category })));
      user.skillsToLearn.forEach(s => dynamicSkills.add(JSON.stringify({ name: s.name, category: s.category })));
    });

    const uniqueSkills = [...dynamicSkills].map(s => JSON.parse(s));
    
    // Merge preset and unique dynamic skills
    const allSkills = [...PRESET_SKILLS];
    uniqueSkills.forEach(ds => {
      if (!allSkills.some(ps => ps.name.toLowerCase() === ds.name.toLowerCase())) {
        allSkills.push(ds);
      }
    });

    res.status(200).json(allSkills);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching skills', error: error.message });
  }
};

// @desc    Add a skill (teach or learn)
// @route   POST /api/users/skills
// @access  Private
const addUserSkill = async (req, res) => {
  const { name, category, level, priority, type } = req.body;

  if (!name || !category || !type) {
    return res.status(400).json({ message: 'Please specify name, category, and type (teach or learn)' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (type === 'teach') {
      // Check if skill already exists
      if (user.skillsCanTeach.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ message: 'Skill already exists in teach list' });
      }
      user.skillsCanTeach.push({ name, category, level: level || 'Intermediate' });
    } else if (type === 'learn') {
      if (user.skillsToLearn.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ message: 'Skill already exists in learn list' });
      }
      user.skillsToLearn.push({ name, category, priority: priority || 'Medium' });
    } else {
      return res.status(400).json({ message: 'Invalid skill type' });
    }

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add user skill', error: error.message });
  }
};

// @desc    Update a skill (teach or learn)
// @route   PUT /api/users/skills
// @access  Private
const updateUserSkill = async (req, res) => {
  const { skillId, level, priority, type } = req.body;

  if (!skillId || !type) {
    return res.status(400).json({ message: 'Please provide skillId and type' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (type === 'teach') {
      const skill = user.skillsCanTeach.id(skillId);
      if (!skill) return res.status(404).json({ message: 'Teaching skill not found' });
      if (level) skill.level = level;
    } else if (type === 'learn') {
      const skill = user.skillsToLearn.id(skillId);
      if (!skill) return res.status(404).json({ message: 'Learning skill not found' });
      if (priority) skill.priority = priority;
    } else {
      return res.status(400).json({ message: 'Invalid skill type' });
    }

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update skill', error: error.message });
  }
};

// @desc    Delete a skill
// @route   DELETE /api/users/skills/:id
// @access  Private
const deleteUserSkill = async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // teach or learn

  if (!type) {
    return res.status(400).json({ message: 'Please specify type query parameter (teach or learn)' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (type === 'teach') {
      user.skillsCanTeach.pull({ _id: id });
    } else if (type === 'learn') {
      user.skillsToLearn.pull({ _id: id });
    } else {
      return res.status(400).json({ message: 'Invalid skill type' });
    }

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete skill', error: error.message });
  }
};

// @desc    Get recommendations (matching score based recommendations)
// @route   GET /api/marketplace/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const userA = await User.findById(req.user._id);
    if (!userA) return res.status(404).json({ message: 'User not found' });

    // Fetch all other users
    const allUsers = await User.find({ _id: { $ne: req.user._id } });
    
    const recommendations = [];

    allUsers.forEach(userB => {
      let teachScore = 0;
      let learnScore = 0;
      let availabilityScore = 0;
      let departmentScore = 0;
      let ratingScore = 0;
      let languageScore = 0;

      // 1. Teach Match (40%): userB teaches what userA wants to learn
      if (userA.skillsToLearn.length > 0) {
        const teachMatches = userB.skillsCanTeach.filter(s => 
          userA.skillsToLearn.some(wl => wl.name.toLowerCase() === s.name.toLowerCase())
        );
        teachScore = (teachMatches.length / userA.skillsToLearn.length) * 40;
        if (teachScore > 40) teachScore = 40;
      }

      // 2. Learn Match (30%): userA teaches what userB wants to learn
      if (userB.skillsToLearn.length > 0) {
        const learnMatches = userA.skillsCanTeach.filter(s => 
          userB.skillsToLearn.some(wl => wl.name.toLowerCase() === s.name.toLowerCase())
        );
        learnScore = (learnMatches.length / userB.skillsToLearn.length) * 30;
        if (learnScore > 30) learnScore = 30;
      }

      // 3. Availability Match (10%): Overlapping availability slots
      let overlapDays = 0;
      if (userA.weeklyAvailability && userB.weeklyAvailability) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(day => {
          const slotsA = userA.weeklyAvailability[day] || [];
          const slotsB = userB.weeklyAvailability[day] || [];
          const common = slotsA.filter(slot => slotsB.includes(slot));
          if (common.length > 0) overlapDays++;
        });
        availabilityScore = overlapDays > 0 ? Math.min(overlapDays * 2, 10) : 0;
      }

      // 4. Department Match (10%): Same academicMajor
      if (userA.academicMajor && userB.academicMajor && 
          userA.academicMajor.toLowerCase().trim() === userB.academicMajor.toLowerCase().trim()) {
        departmentScore = 10;
      }

      // 5. Rating weight (5%): userB's average rating
      if (userB.rating > 0) {
        ratingScore = (userB.rating / 5) * 5;
      }

      // 6. Language match (5%): overlap in spoken languages
      const langsA = userA.languages || ['English'];
      const langsB = userB.languages || ['English'];
      const commonLangs = langsA.filter(l => langsB.map(lb => lb.toLowerCase()).includes(l.toLowerCase()));
      if (commonLangs.length > 0) {
        languageScore = 5;
      }

      const totalScore = Math.round(teachScore + learnScore + availabilityScore + departmentScore + ratingScore + languageScore);

      // Only recommend if they have a non-zero matching compatibility (specifically matching teach/learn)
      if (totalScore > 0 && (teachScore > 0 || learnScore > 0)) {
        recommendations.push({
          user: {
            _id: userB._id,
            name: userB.name,
            avatar: userB.avatar,
            academicMajor: userB.academicMajor,
            yearOfStudy: userB.yearOfStudy,
            rating: userB.rating,
            completedSessions: userB.completedSessions,
            skillsCanTeach: userB.skillsCanTeach,
            skillsToLearn: userB.skillsToLearn,
            weeklyAvailability: userB.weeklyAvailability,
            languages: userB.languages,
            mentorBadges: userB.mentorBadges
          },
          compatibilityScore: totalScore,
          isPerfectMatch: totalScore >= 85
        });
      }
    });

    // Sort by highest compatibility score
    recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.status(200).json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Recommendations generation failed', error: error.message });
  }
};

// @desc    Search students by skills, major, year, availability, rating
// @route   GET /api/marketplace/search
// @access  Private
const searchStudents = async (req, res) => {
  const { skill, department, year, availability, rating } = req.query;

  try {
    let query = { _id: { $ne: req.user._id } };

    if (department) {
      query.academicMajor = { $regex: department, $options: 'i' };
    }
    if (year) {
      query.yearOfStudy = year;
    }
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }
    if (skill) {
      query.$or = [
        { 'skillsCanTeach.name': { $regex: skill, $options: 'i' } },
        { 'skillsToLearn.name': { $regex: skill, $options: 'i' } }
      ];
    }
    if (availability) {
      const day = availability.toLowerCase();
      query[`weeklyAvailability.${day}`] = { $exists: true, $not: { $size: 0 } };
    }

    const students = await User.find(query, '-password')
      .limit(30);

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Student search failed', error: error.message });
  }
};

// @desc    Send exchange request
// @route   POST /api/exchange/request
// @access  Private
const createExchangeRequest = async (req, res) => {
  const { receiverId, skill, message } = req.body;

  if (!receiverId || !skill) {
    return res.status(400).json({ message: 'Please provide receiverId and skill name' });
  }

  try {
    // Check if recipient exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Recipient student not found' });
    }

    // Check if duplicate pending request
    const existing = await SkillExchangeRequest.findOne({
      sender: req.user._id,
      receiver: receiverId,
      skill,
      status: 'Pending'
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already sent a pending request for this skill' });
    }

    const exchangeRequest = await SkillExchangeRequest.create({
      sender: req.user._id,
      receiver: receiverId,
      skill,
      message: message || `Hey! Let's swap skills! I noticed you are interested in ${skill}.`
    });

    // Populate sender details for notifications
    const populatedRequest = await SkillExchangeRequest.findById(exchangeRequest._id)
      .populate('sender', 'name avatar academicMajor');

    // Realtime Socket Notification
    const io = req.app.get('socketio');
    if (io) {
      io.to(receiverId.toString()).emit('exchangeRequestReceived', populatedRequest);
    }

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send request', error: error.message });
  }
};

// @desc    Accept exchange request
// @route   PUT /api/exchange/request/:id/accept
// @access  Private
const acceptExchangeRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await SkillExchangeRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Exchange request not found' });

    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized action' });
    }

    request.status = 'Accepted';
    await request.save();

    const populatedRequest = await SkillExchangeRequest.findById(id)
      .populate('receiver', 'name avatar');

    // Realtime notification to sender
    const io = req.app.get('socketio');
    if (io) {
      io.to(request.sender.toString()).emit('exchangeRequestAccepted', populatedRequest);
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Failed to accept request', error: error.message });
  }
};

// @desc    Reject exchange request
// @route   PUT /api/exchange/request/:id/reject
// @access  Private
const rejectExchangeRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const request = await SkillExchangeRequest.findById(id);
    if (!request) return res.status(404).json({ message: 'Exchange request not found' });

    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized action' });
    }

    request.status = 'Rejected';
    await request.save();

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject request', error: error.message });
  }
};

// @desc    Get request history
// @route   GET /api/exchange/history
// @access  Private
const getExchangeHistory = async (req, res) => {
  try {
    const requests = await SkillExchangeRequest.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
      .populate('sender', 'name avatar academicMajor')
      .populate('receiver', 'name avatar academicMajor')
      .sort({ createdAt: -1 });

    const sessions = await SkillSession.find({
      $or: [
        { mentor: req.user._id },
        { learner: req.user._id }
      ]
    })
      .populate('mentor', 'name avatar academicMajor')
      .populate('learner', 'name avatar academicMajor')
      .sort({ date: -1 });

    res.status(200).json({ requests, sessions });
  } catch (error) {
    res.status(500).json({ message: 'History retrieval failed', error: error.message });
  }
};

// @desc    Book a new session
// @route   POST /api/session
// @access  Private
const bookSession = async (req, res) => {
  const { partnerId, skill, date, duration, meetingType, notes } = req.body;

  if (!partnerId || !skill || !date || !duration) {
    return res.status(400).json({ message: 'Please add all required scheduling fields' });
  }

  try {
    // Verify partner
    const partner = await User.findById(partnerId);
    if (!partner) return res.status(404).json({ message: 'Selected study partner not found' });

    // Credits checking: if user is the learner (booking study help), they must have at least 20 credits
    const learner = req.user;
    if (learner.credits < 20) {
      return res.status(400).json({ message: 'Insufficient Credits. You need 20 credits to book a learning session.' });
    }

    // Auto-generate virtual link if video/chat meeting type
    let meetingLink = '';
    const uniqueRoom = `studysphere-session-${Math.random().toString(36).substr(2, 9)}`;
    if (meetingType !== 'In Person') {
      meetingLink = `https://meet.jit.si/${uniqueRoom}`;
    }

    const session = await SkillSession.create({
      mentor: partnerId, // Mentor is the partner
      learner: req.user._id, // Learner is the current booking user
      skill,
      date,
      duration,
      meetingType: meetingType || 'Video',
      meetingLink,
      notes: notes || ''
    });

    const populatedSession = await SkillSession.findById(session._id)
      .populate('mentor', 'name avatar')
      .populate('learner', 'name avatar');

    // Notify mentor via socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(partnerId.toString()).emit('sessionBooked', populatedSession);
    }

    res.status(201).json(populatedSession);
  } catch (error) {
    res.status(500).json({ message: 'Session booking failed', error: error.message });
  }
};

// @desc    Submit mentor review and handle credit transaction / gamification badges
// @route   POST /api/session/review
// @access  Private
const submitReview = async (req, res) => {
  const { sessionId, rating, communication, knowledge, helpfulness, comment } = req.body;

  if (!sessionId || !rating || !communication || !knowledge || !helpfulness) {
    return res.status(400).json({ message: 'Please provide all review ratings' });
  }

  try {
    const session = await SkillSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.learner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Only the learner can review the mentor' });
    }

    if (session.status === 'Completed') {
      return res.status(400).json({ message: 'You have already reviewed this session' });
    }

    // 1. Create Review
    const review = await SkillReview.create({
      mentor: session.mentor,
      learner: session.learner,
      session: sessionId,
      rating,
      communication,
      knowledge,
      helpfulness,
      comment: comment || ''
    });

    // 2. Update Session status
    session.status = 'Completed';
    session.rating = rating;
    session.feedback = comment || '';
    await session.save();

    // 3. Credit Transaction (Mentor receives 20, Learner loses 20)
    const mentor = await User.findById(session.mentor);
    const learner = await User.findById(session.learner);

    learner.credits = Math.max(0, learner.credits - 20);
    mentor.credits = mentor.credits + 20;

    // 4. Update Mentor average rating and session count
    const mentorReviews = await SkillReview.find({ mentor: session.mentor });
    const ratingsSum = mentorReviews.reduce((sum, r) => sum + r.rating, 0);
    mentor.rating = parseFloat((ratingsSum / mentorReviews.length).toFixed(1));
    mentor.completedSessions = mentor.completedSessions + 1;

    // 5. Evaluate Gamification badges for Mentor
    const earnedBadges = new Set(mentor.mentorBadges || []);

    // Badge Check: React Mentor / Java Expert
    if (session.skill.toLowerCase() === 'react') earnedBadges.add('React Mentor');
    if (session.skill.toLowerCase() === 'java') earnedBadges.add('Java Expert');

    // Badge Check: Knowledge Hero (>= 5 sessions completed)
    if (mentor.completedSessions >= 5) earnedBadges.add('Knowledge Hero');

    // Badge Check: Top Rated Teacher (Average rating >= 4.8 and >= 3 sessions)
    if (mentor.rating >= 4.8 && mentor.completedSessions >= 3) {
      earnedBadges.add('Top Rated Teacher');
    }

    // Badge Check: Campus Expert (taught >= 3 distinct learners)
    const distinctLearners = await SkillSession.distinct('learner', { mentor: session.mentor, status: 'Completed' });
    if (distinctLearners.length >= 3) {
      earnedBadges.add('Campus Expert');
    }

    // Badge Check: 100 Hours Mentor (total duration of completed mentoring sessions >= 6000 minutes)
    const completedMentorSessions = await SkillSession.find({ mentor: session.mentor, status: 'Completed' });
    const totalMinutes = completedMentorSessions.reduce((sum, s) => sum + (s.duration || 60), 0);
    if (totalMinutes >= 6000) {
      earnedBadges.add('100 Hours Mentor');
    }

    mentor.mentorBadges = [...earnedBadges];

    await learner.save();
    await mentor.save();

    // Notify mentor of review and credit updates
    const io = req.app.get('socketio');
    if (io) {
      io.to(mentor._id.toString()).emit('creditsEarned', {
        credits: 20,
        currentCredits: mentor.credits,
        badgeEarned: mentor.mentorBadges.length > (mentor.mentorBadges.length - earnedBadges.size) ? [...earnedBadges].pop() : null
      });
    }

    res.status(201).json({ review, session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit review', error: error.message });
  }
};

module.exports = {
  getAllSkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill,
  getRecommendations,
  searchStudents,
  createExchangeRequest,
  acceptExchangeRequest,
  rejectExchangeRequest,
  getExchangeHistory,
  bookSession,
  submitReview
};
