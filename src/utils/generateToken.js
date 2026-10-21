const jwt = require('jsonwebtoken');

/**
 * Signs a JWT containing the user's id and role.
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generates a JWT, stores it in an httpOnly cookie, and sends the response.
 * The password field is stripped automatically by the User schema's toJSON
 * transform, so it is safe to pass the full Mongoose document here.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);

  const cookieDays = parseInt(process.env.COOKIE_EXPIRE_DAYS, 10) || 7;

  const cookieOptions = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      data: user,
    });
};

module.exports = { generateToken, sendTokenResponse };
