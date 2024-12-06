import mongoose from 'mongoose'

const assessmentSchema = new mongoose.Schema({
  assessmentType: {
    type: String,
    enum: ['QNA', 'MCQ', 'FILE'],
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  isTimeBound: {
    type: Boolean,
    default: false
  },
  timeAllowed: {
    type: Number, // Time in minutes
    required: function() {
      return this.isTimeBound
    }
  },
  content: {
    questions: [{
      question: String,
      answer: String
    }],
    mcqs: [{
      question: String,
      options: [String],
      correctAnswer: String,
      audioFile: String
    }],
    assessmentFile: String,
    supportingFile: String
  }
}, { timestamps: true })

const Assessment = mongoose.model('Assessment', assessmentSchema)
export default Assessment 