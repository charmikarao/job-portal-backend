const express = require('express');
const {
  getJobs,
  getJob,
  createJob,
  getMyJobs,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const { createJobValidator, updateJobValidator } = require('../validators/jobValidators');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

// Public routes
router.get('/', getJobs);

// NOTE: this specific route must be declared before the '/:id' route below,
// otherwise Express would treat "employer" as a job ID.
router.get('/employer/my-jobs', protect, authorize('employer'), getMyJobs);

router.get('/:id', getJob);

// Employer-only routes
router.post('/', protect, authorize('employer'), createJobValidator, validate, createJob);
router.put('/:id', protect, authorize('employer'), updateJobValidator, validate, updateJob);
router.delete('/:id', protect, authorize('employer'), deleteJob);

module.exports = router;
