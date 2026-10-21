const mongoose = require('mongoose');

/**
 * Salary range belongs entirely to its parent job posting and is always
 * read/updated together with it, so it is embedded rather than referenced.
 */
const salaryRangeSchema = new mongoose.Schema(
  {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
    },
    employmentType: {
      type: String,
      enum: {
        values: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
        message: 'Invalid employment type',
      },
      required: [true, 'Employment type is required'],
    },
    salaryRange: {
      type: salaryRangeSchema,
      default: () => ({}),
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    experienceRequired: {
      type: String,
      trim: true,
      default: 'Not specified',
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    applicationDeadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    // Reference relationship: a Job has its own identity/lifecycle
    // independent of the User, and is queried on its own, so it is
    // referenced rather than embedded inside the employer's document.
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', description: 'text', location: 'text' });
jobSchema.index({ employer: 1 });

module.exports = mongoose.model('Job', jobSchema);
