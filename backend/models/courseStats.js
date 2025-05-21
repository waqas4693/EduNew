import mongoose from 'mongoose'

const courseStatsSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    unique: true
  },
  totalUnits: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

const CourseStats = mongoose.model('CourseStats', courseStatsSchema)
export default CourseStats 