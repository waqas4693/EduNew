import mongoose from 'mongoose'

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  }
}, { timestamps: false })

// Compound unique index for number within a course
unitSchema.index({ courseId: 1, number: 1 }, { unique: true })

const Unit = mongoose.model('Unit', unitSchema)
export default Unit
