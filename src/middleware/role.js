const ApiError = require('../utils/ApiError');

/**
 * Restricts a route to the given role(s). Must be used after `protect` so
 * that req.user is already populated.
 *   e.g. router.post('/', protect, authorize('employer'), createJob)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(
      403,
      `Role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource`
    );
  }
  next();
};

module.exports = authorize;
