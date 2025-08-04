import mongoose from 'mongoose'

const courseWiseProgressSchema = new mongoose.Schema({
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
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedUnits: {
    type: Number,
    default: 0
  },
  totalUnits: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
})

// Compound index for quick lookups
courseWiseProgressSchema.index({ 
  studentId: 1, 
  courseId: 1 
}, { unique: true })

// Pre-save middleware to ensure percentage is within bounds
courseWiseProgressSchema.pre('save', function(next) {
  this.progressPercentage = Math.min(Math.max(this.progressPercentage, 0), 100)
  this.lastUpdated = new Date()
  next()
})

const CourseWiseProgress = mongoose.model('CourseWiseProgress', courseWiseProgressSchema)
export default CourseWiseProgress 