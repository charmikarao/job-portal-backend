const mongoose = require('mongoose');

/**
 * An Application has its own lifecycle (status changes over time,
 * independent of the Job or the applicant) and is queried independently
 * from both sides of the relationship, so it is modeled as its own
 * collection with references rather than embedded in Job or User.
 */
const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['applied', 'under review', 'shortlisted', 'rejected', 'accepted'],
        message: 'Invalid application status',
      },
      default: 'applied',
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A job seeker should not be able to apply for the same job more than once.
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
