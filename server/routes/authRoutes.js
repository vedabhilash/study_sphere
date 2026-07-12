const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateProfile, uploadAvatar, getMatches, seedMatchesProduction, getTurnCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/matches', protect, getMatches);
router.get('/seed-matches', protect, seedMatchesProduction);
router.get('/turn-credentials', protect, getTurnCredentials);

module.exports = router;
