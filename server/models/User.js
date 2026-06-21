import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
    default: 'ST'
  },
  major: {
    type: String,
    default: 'Undeclared'
  },
  bio: {
    type: String,
    default: ''
  },
  courses: {
    type: [String],
    default: []
  },
  availability: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': [], 'Saturday': [], 'Sunday': []
    }
  },
  learningGoals: {
    type: [String],
    default: []
  },
  groupSizePreference: {
    type: Number,
    default: 4
  },
  studyStyle: {
    type: String,
    default: 'discussion'
  },
  privacy: {
    visibility: {
      type: String,
      default: 'public'
    },
    showSchedule: {
      type: Boolean,
      default: true
    }
  },
  rating: {
    type: Number,
    default: 5.0
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
