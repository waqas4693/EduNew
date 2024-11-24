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
    enum: ['VIDEO', 'IMAGE', 'AUDIO', 'PDF', 'PPT', 'TEXT'],
    required: true
  },
  content: {
    text: String,
    questions: [{
      question: String,
      answer: String
    }],
    backgroundImage: String,
    previewImage: String,
    thumbnailUrl: String,
    externalLink: String
  },
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  }
}, { timestamps: false })

const Resource = mongoose.model('Resource', resourceSchema)
export default Resource
