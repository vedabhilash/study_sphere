const mongoose = require('mongoose');

const skillSessionSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skill: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  meetingLink: {
    type: String,
    default: ''
  },
  meetingType: {
    type: String,
    enum: ['Video', 'Chat', 'In Person'],
    default: 'Video'
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  feedback: {
    type: String,
    default: ''
  },
  rating: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for history filtering and dashboard statistics
skillSessionSchema.index({ mentor: 1, status: 1 });
skillSessionSchema.index({ learner: 1, status: 1 });

module.exports = mongoose.model('SkillSession', skillSessionSchema);
