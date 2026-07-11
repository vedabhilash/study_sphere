const mongoose = require('mongoose');

const skillReviewSchema = new mongoose.Schema({
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
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillSession',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  communication: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  knowledge: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  helpfulness: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SkillReview', skillReviewSchema);
