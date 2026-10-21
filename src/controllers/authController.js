const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');

// @desc    Register a new Job Seeker or Employer account
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName, skills, education, experience } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'An account with this email already exists');
  }

  const finalRole = role === 'employer' ? 'employer' : 'jobseeker';

  const userData = { name, email, password, role: finalRole };

  if (finalRole === 'employer') {
    userData.companyName = companyName;
  } else {
    if (skills) userData.skills = skills;
    if (education) userData.education = education;
    if (experience) userData.experience = experience;
  }

  const user = await User.create(userData);

  sendTokenResponse(user, 201, res);
});

// @desc    Login and receive the authentication cookie
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'Your account has been suspended. Contact the platform admin.');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Logout the current user and clear the authentication cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get the logged-in user's own profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

// @desc    Update the logged-in user's own profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'companyName', 'skills', 'education', 'experience'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: user });
});
