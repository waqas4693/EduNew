import mongoose from 'mongoose'

const assessmentAttemptSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: [
      'SUBMITTED',
      'PLAGIARISM_CHECK',
      'MARKING',
      'MARKED',
      'MODERATION',
      'MARKING_REVISION',
      'VERIFICATION',
      'MODERATION_REVISION',
      'GRADED'
    ],
    default: 'SUBMITTED'
  },
  obtainedMarks: {
    type: Number,
    default: 0
  },
  content: {
    answers: [{
      questionId: String,
      answer: String
    }],
    mcqAnswers: [{
      mcqId: String,
      selectedOption: String
    }],
    submittedFile: String
  },
  feedbackFile: {
    type: String
  },
  moderatorDecision: {
    status: {
      type: String,
      enum: ['SATISFIED', 'NOT_SATISFIED']
    },
    comments: String,
    decidedAt: Date
  },
  verifierDecision: {
    status: {
      type: String,
      enum: ['SATISFIED', 'NOT_SATISFIED']
    },
    comments: String,
    decidedAt: Date
  },
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date
  }
}, { timestamps: true })

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema)
export default AssessmentAttempt 