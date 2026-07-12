const express = require('express');
const router = express.Router();
const {
  getGroups,
  createGroup,
  getGroupById,
  joinGroup,
  leaveGroup,
  createSession,
  attendSession
} = require('../controllers/groupController');
const { getMessages, createMessage } = require('../controllers/messageController');
const { getResources, createResource } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { validateGroup, validateSession } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes here are protected
router.use(protect);

router.route('/')
  .get(getGroups)
  .post(validateGroup, createGroup);

router.post('/join', joinGroup);

router.route('/:id')
  .get(getGroupById);

router.delete('/:id/leave', leaveGroup);

router.post('/:id/sessions', validateSession, createSession);
router.post('/:id/sessions/:sessionId/attend', attendSession);

// Group Message routes
router.route('/:id/messages')
  .get(getMessages)
  .post(upload.single('file'), createMessage);

// Group Resource routes
router.route('/:id/resources')
  .get(getResources)
  .post(upload.single('file'), createResource);

module.exports = router;
