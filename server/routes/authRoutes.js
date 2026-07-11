const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, uploadAvatar, getMatches } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/matches', protect, getMatches);

module.exports = router;
