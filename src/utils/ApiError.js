/**
 * Custom error class used across controllers to attach an HTTP status code
 * to an error message. Thrown errors are caught by asyncHandler and passed
 * to the centralized errorHandler middleware.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
