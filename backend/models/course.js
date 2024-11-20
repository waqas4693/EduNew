import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  units: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }],
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  }
}, { timestamps: false })

const Course = mongoose.model('Course', courseSchema)
export default Course
