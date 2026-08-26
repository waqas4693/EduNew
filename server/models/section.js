import mongoose from 'mongoose'

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  number: {
    type: Number,
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
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  }
}, { timestamps: false })

// Compound unique index for number within a unit
sectionSchema.index({ unitId: 1, number: 1 }, { unique: true })

const Section = mongoose.model('Section', sectionSchema)
export default Section
