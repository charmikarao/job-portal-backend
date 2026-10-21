const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all open jobs, with optional search/filter/pagination
// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
  const { search, location, employmentType, page = 1, limit = 10 } = req.query;

  const query = { status: 'open' };
  if (location) query.location = { $regex: location, $options: 'i' };
  if (employmentType) query.employmentType = employmentType;
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate('employer', 'name companyName email')
      .sort({ postedDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Job.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: jobs,
  });
});

// @desc    Get a single job by ID
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('employer', 'name companyName email');

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  res.status(200).json({ success: true, data: job });
});

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (Employer)
exports.createJob = asyncHandler(async (req, res) => {
  const jobData = { ...req.body, employer: req.user._id };
  const job = await Job.create(jobData);

  res.status(201).json({ success: true, data: job });
});

// @desc    Get all jobs posted by the logged-in employer
// @route   GET /api/jobs/employer/my-jobs
// @access  Private (Employer)
exports.getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employer: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: jobs.length, data: jobs });
});

// @desc    Update a job posting owned by the logged-in employer
// @route   PUT /api/jobs/:id
// @access  Private (Employer - owner only)
exports.updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.employer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this job posting');
  }

  // Prevent employer field from being changed via request body
  const { employer, ...safeUpdates } = req.body;

  const updatedJob = await Job.findByIdAndUpdate(req.params.id, safeUpdates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: updatedJob });
});

// @desc    Delete a job posting owned by the logged-in employer
// @route   DELETE /api/jobs/:id
// @access  Private (Employer - owner only)
exports.deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.employer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this job posting');
  }

  await Application.deleteMany({ job: job._id });
  await job.deleteOne();

  res.status(200).json({ success: true, message: 'Job posting deleted successfully' });
});
