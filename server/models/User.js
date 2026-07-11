const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  academicMajor: {
    type: String,
    default: ''
  },
  yearOfStudy: {
    type: String,
    default: ''
  },
  university: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  courses: {
    type: [String],
    default: []
  },
  preferredGroupSize: {
    type: String,
    default: ''
  },
  preferredStudyStyle: {
    type: String,
    default: ''
  },
  learningGoals: {
    type: [String],
    default: []
  },
  weeklyAvailability: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  privacy: {
    showProfileMatchFinder: {
      type: Boolean,
      default: true
    },
    shareScheduleStudyPartners: {
      type: Boolean,
      default: true
    },
    allowStudyInvitations: {
      type: Boolean,
      default: true
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    receiveNotifications: {
      type: Boolean,
      default: true
    }
  },
  groupsJoined: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  skillsCanTeach: [{
    name: { type: String, required: true },
    category: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' }
  }],
  skillsToLearn: [{
    name: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
  }],
  rating: {
    type: Number,
    default: 0
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  credits: {
    type: Number,
    default: 100
  },
  languages: {
    type: [String],
    default: ['English']
  },
  mentorBadges: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Match user entered password to hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
