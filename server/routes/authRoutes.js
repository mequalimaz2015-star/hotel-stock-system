const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, verifyPassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', protect, authorize('admin'), registerUser);
router.get('/me', protect, getMe);
router.post('/verify-password', protect, verifyPassword);

module.exports = router;
