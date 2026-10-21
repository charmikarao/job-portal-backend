const express = require('express');
const {
  getUsers,
  getUser,
  updateUserStatus,
  deleteUser,
  getAllJobs,
  getJobById,
  deleteJobByAdmin,
} = require('../controllers/adminController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = express.Router();

// Every route below requires authentication AND the 'admin' role
router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

router.get('/jobs', getAllJobs);
router.get('/jobs/:id', getJobById);
router.delete('/jobs/:id', deleteJobByAdmin);

module.exports = router;
