import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  subtasks: [subtaskSchema]
});

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 60 },
  location: { type: String, default: 'Virtual Room' },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['link', 'note', 'problem'], required: true },
  content: { type: String, required: true },
  postedBy: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  category: { type: String, default: 'General Notes' }
});

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true }, // can be user ID or 'system'
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true }
});

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxSize: {
    type: Number,
    default: 4
  },
  studyStyle: {
    type: String,
    default: 'discussion'
  },
  goals: [goalSchema],
  meetings: [meetingSchema],
  resources: [resourceSchema],
  messages: [messageSchema]
}, {
  timestamps: true
});

const Group = mongoose.model('Group', groupSchema);
export default Group;
