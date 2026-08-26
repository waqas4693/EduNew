import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  },
  units: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }]
}, { timestamps: false })

const Course = mongoose.model('Course', courseSchema)
export default Course
