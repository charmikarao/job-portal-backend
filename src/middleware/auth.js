const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Verifies the JWT stored in the httpOnly `token` cookie and attaches the
 * authenticated user to req.user. Also accepts a Bearer token as a fallback
 * for API clients/tests that cannot rely on a cookie jar.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no authentication token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Not authorized, user no longer exists');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'Your account has been suspended. Contact the platform admin.');
  }

  req.user = user;
  next();
});

module.exports = protect;
