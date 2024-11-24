import mongoose from 'mongoose'

const assessmentAttemptSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUBMITTED', 'GRADED'],
    default: 'PENDING'
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
  submittedAt: {
    type: Date
  }
}, { timestamps: true })

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema)
export default AssessmentAttempt 