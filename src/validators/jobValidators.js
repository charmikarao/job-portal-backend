const { body } = require('express-validator');

const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];

exports.createJobValidator = [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('description').trim().notEmpty().withMessage('Job description is required'),
  body('location').trim().notEmpty().withMessage('Job location is required'),
  body('employmentType')
    .isIn(EMPLOYMENT_TYPES)
    .withMessage(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`),
  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Application deadline must be a valid date'),
  body('requiredSkills').optional().isArray().withMessage('Required skills must be an array of strings'),
  body('salaryRange.min').optional().isNumeric().withMessage('Minimum salary must be a number'),
  body('salaryRange.max').optional().isNumeric().withMessage('Maximum salary must be a number'),
];

exports.updateJobValidator = [
  body('employmentType')
    .optional()
    .isIn(EMPLOYMENT_TYPES)
    .withMessage(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`),
  body('status').optional().isIn(['open', 'closed']).withMessage('Job status must be open or closed'),
  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Application deadline must be a valid date'),
];
