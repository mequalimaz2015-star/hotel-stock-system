const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc  Register a new user (admin only, in practice)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({ name, email, password, role });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc  Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact your administrator.');
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc  Get current user profile
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc  Verify the current user's password (used for approval gates)
// POST /api/auth/verify-password  { password: "..." }
// Returns { valid: true } or 401
const verifyPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) { res.status(400); throw new Error('Password is required'); }

  // Re-fetch with password field (normally excluded)
  const user = await User.findById(req.user._id).select('+password');
  if (!user) { res.status(404); throw new Error('User not found'); }

  const match = await user.matchPassword(password);
  if (!match) { res.status(401); throw new Error('Incorrect password'); }

  res.json({ valid: true, userId: user._id, name: user.name, role: user.role });
});

module.exports = { registerUser, loginUser, getMe, verifyPassword };
