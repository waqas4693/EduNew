import mongoose from 'mongoose'

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  resources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  }
}, { timestamps: false })

const Section = mongoose.model('Section', sectionSchema)
export default Section
