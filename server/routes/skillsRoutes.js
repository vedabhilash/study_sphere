const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateSession } = require('../middleware/validationMiddleware');
const {
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
  submitReview,
  cancelSession
} = require('../controllers/skillsController');

// Skills management
router.get('/skills', protect, getAllSkills);
router.post('/users/skills', protect, addUserSkill);
router.put('/users/skills', protect, updateUserSkill);
router.delete('/users/skills/:id', protect, deleteUserSkill);

// Recommendations & Search
router.get('/marketplace/recommendations', protect, getRecommendations);
router.get('/marketplace/search', protect, searchStudents);

// Exchange Requests
router.post('/exchange/request', protect, createExchangeRequest);
router.put('/exchange/request/:id/accept', protect, acceptExchangeRequest);
router.put('/exchange/request/:id/reject', protect, rejectExchangeRequest);
router.get('/exchange/history', protect, getExchangeHistory);

// Session & Review
router.post('/session', protect, validateSession, bookSession);
router.post('/session/review', protect, submitReview);
router.post('/session/:id/cancel', protect, cancelSession);

module.exports = router;
