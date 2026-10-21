/**
 * Wraps an async Express route handler so any rejected promise or thrown
 * error is forwarded to next(), where the centralized error handler
 * middleware can process it.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
