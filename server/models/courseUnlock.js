import mongoose from 'mongoose'

const courseUnlockSchema = new mongoose.Schema({
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
  unlockedUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  unlockedSection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
})

// Compound index for quick lookups
courseUnlockSchema.index({ 
  studentId: 1, 
  courseId: 1
}, { unique: true })

  // Index for unlocked unit and section
courseUnlockSchema.index({ unlockedUnit: 1 })
courseUnlockSchema.index({ unlockedSection: 1 })

const CourseUnlock = mongoose.model('CourseUnlock', courseUnlockSchema)
export default CourseUnlock 