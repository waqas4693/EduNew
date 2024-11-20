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
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  }
}, { timestamps: false })

const Resource = mongoose.model('Resource', resourceSchema)
export default Resource
