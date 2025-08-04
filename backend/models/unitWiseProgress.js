import mongoose from 'mongoose'

const unitWiseProgressSchema = new mongoose.Schema({
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
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedSections: {
    type: Number,
    default: 0
  },
  totalSections: {
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
unitWiseProgressSchema.index({ 
  studentId: 1, 
  courseId: 1, 
  unitId: 1 
}, { unique: true })

// Index for course-based queries
unitWiseProgressSchema.index({ studentId: 1, courseId: 1 })

// Pre-save middleware to ensure percentage is within bounds
unitWiseProgressSchema.pre('save', function(next) {
  this.progressPercentage = Math.min(Math.max(this.progressPercentage, 0), 100)
  this.lastUpdated = new Date()
  next()
})

const UnitWiseProgress = mongoose.model('UnitWiseProgress', unitWiseProgressSchema)
export default UnitWiseProgress 