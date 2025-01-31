import mongoose from 'mongoose'

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  resourceType: {
    type: String,
    enum: ['VIDEO', 'IMAGE', 'AUDIO', 'PDF', 'PPT', 'TEXT', 'MCQ'],
    required: true
  },
  content: {
    fileName: String,
    questions: [{
      question: String,
      answer: String
    }],
    backgroundImage: String,
    thumbnailUrl: String,
    externalLinks: [{
      name: String,
      url: String
    }],
    repeatCount: {
      type: Number,
      min: 1,
      max: 11,
      default: 1
    },
    mcq: {
      question: String,
      options: [String],
      numberOfCorrectAnswers: {
        type: Number,
        min: 1,
        required: function() {
          return this.resourceType === 'MCQ'
        }
      },
      correctAnswers: {
        type: [String],
        required: function() {
          return this.resourceType === 'MCQ'
        }
      },
      imageFile: String,
      audioFile: String
    }
  },
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  }
}, { timestamps: false })

const Resource = mongoose.model('Resource', resourceSchema)
export default Resource