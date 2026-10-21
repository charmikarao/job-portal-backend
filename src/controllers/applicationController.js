const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Application = require('../models/Application');
const Job = require('../models/Job');

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (Job Seeker)
exports.applyForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.status !== 'open') {
    throw new ApiError(400, 'This job is no longer accepting applications');
  }

  const existing = await Application.findOne({ job: job._id, applicant: req.user._id });
  if (existing) {
    throw new ApiError(400, 'You have already applied for this job');
  }

  const application = await Application.create({
    job: job._id,
    applicant: req.user._id,
    coverLetter: req.body.coverLetter,
  });

  res.status(201).json({ success: true, data: application });
});

// @desc    Get all applications submitted by the logged-in job seeker
// @route   GET /api/applications/my-applications
// @access  Private (Job Seeker)
exports.getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate('job', 'title companyName location status employmentType')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: applications.length, data: applications });
});

// @desc    Get all applications received for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer - owner of the job only)
exports.getApplicationsForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.employer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to view applications for this job');
  }

  const applications = await Application.find({ job: job._id })
    .populate('applicant', 'name email skills experience education')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: applications.length, data: applications });
});

// @desc    Update the status of an application
// @route   PUT /api/applications/:id/status
// @access  Private (Employer - owner of the related job only)
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id).populate('job');

  if (!application) {
    throw new ApiError(404, 'Application not found');
  }

  if (application.job.employer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this application');
  }

  application.status = req.body.status;
  await application.save();

  res.status(200).json({ success: true, data: application });
});
