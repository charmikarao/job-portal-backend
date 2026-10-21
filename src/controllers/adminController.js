const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all registered users (optionally filtered by role)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const query = {};
  if (role) query.role = role;

  const users = await User.find(query).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Get a single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.status(200).json({ success: true, data: user });
});

// @desc    Update a user's status (active / suspended)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    throw new ApiError(400, "Status must be either 'active' or 'suspended'");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({ success: true, data: user });
});

// @desc    Delete a user and clean up their related data
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role === 'employer') {
    const jobs = await Job.find({ employer: user._id }, '_id');
    const jobIds = jobs.map((j) => j._id);
    await Application.deleteMany({ job: { $in: jobIds } });
    await Job.deleteMany({ employer: user._id });
  } else if (user.role === 'jobseeker') {
    await Application.deleteMany({ applicant: user._id });
  }

  await user.deleteOne();

  res.status(200).json({ success: true, message: 'User deleted successfully' });
});

// @desc    Get all job postings on the platform
// @route   GET /api/admin/jobs
// @access  Private (Admin)
exports.getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find()
    .populate('employer', 'name email companyName')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: jobs.length, data: jobs });
});

// @desc    Get a single job posting by ID
// @route   GET /api/admin/jobs/:id
// @access  Private (Admin)
exports.getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('employer', 'name email companyName');
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  res.status(200).json({ success: true, data: job });
});

// @desc    Remove an inappropriate or invalid job posting
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
exports.deleteJobByAdmin = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  await Application.deleteMany({ job: job._id });
  await job.deleteOne();

  res.status(200).json({ success: true, message: 'Job posting removed successfully' });
});
