import mongoose from 'mongoose'

const sectionUnlockStatusSchema = new mongoose.Schema({
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
  unlockedSections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// Compound index for quick lookups
sectionUnlockStatusSchema.index({ 
  studentId: 1, 
  courseId: 1,
  unitId: 1
}, { unique: true })

const SectionUnlockStatus = mongoose.model('SectionUnlockStatus', sectionUnlockStatusSchema)
export default SectionUnlockStatus 