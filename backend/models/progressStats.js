import mongoose from 'mongoose'

const progressStatsSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseprogress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  recalculateProgress: {
    type: Boolean,
    default: false
  },
}, { timestamps: true })

progressStatsSchema.index({ 
  studentId: 1, 
  courseId: 1, 
}, { unique: true })

progressStatsSchema.index({ sectionIds: 1 })
progressStatsSchema.index({ studentId: 1, courseId: 1 })

const ProgressStats = mongoose.model('ProgressStats', progressStatsSchema)
export default ProgressStats

