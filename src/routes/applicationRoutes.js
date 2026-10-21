const express = require('express');
const {
  applyForJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { applyValidator, updateStatusValidator } = require('../validators/applicationValidators');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

// Job Seeker routes
router.post('/:jobId', protect, authorize('jobseeker'), applyValidator, validate, applyForJob);
router.get('/my-applications', protect, authorize('jobseeker'), getMyApplications);

// Employer routes
router.get('/job/:jobId', protect, authorize('employer'), getApplicationsForJob);
router.put(
  '/:id/status',
  protect,
  authorize('employer'),
  updateStatusValidator,
  validate,
  updateApplicationStatus
);

module.exports = router;
