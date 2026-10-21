const { body } = require('express-validator');

exports.applyValidator = [
  body('coverLetter')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters'),
];

exports.updateStatusValidator = [
  body('status')
    .isIn(['applied', 'under review', 'shortlisted', 'rejected', 'accepted'])
    .withMessage('Invalid application status'),
];
