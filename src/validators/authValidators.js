const { body } = require('express-validator');

exports.registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['jobseeker', 'employer'])
    .withMessage('Role must be either jobseeker or employer'),
  body('companyName')
    .if(body('role').equals('employer'))
    .trim()
    .notEmpty()
    .withMessage('Company name is required for employer accounts'),
];

exports.loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
