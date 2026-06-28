const express = require('express');
const router = express.Router();
const { toggleLikeResource, deleteResource } = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/:id/like', toggleLikeResource);
router.delete('/:id', deleteResource);

module.exports = router;
