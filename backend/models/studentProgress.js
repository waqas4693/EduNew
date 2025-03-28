import mongoose from 'mongoose'

const mcqProgressSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  attempts: {
    type: Number,
    default: 0
  }
})

const studentProgressSchema = new mongoose.Schema({
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
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  mcqProgress: [mcqProgressSchema],
  lastAccessedResource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    default: null
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// Compound index for quick lookups
studentProgressSchema.index({ 
  studentId: 1, 
  courseId: 1, 
  unitId: 1, 
  sectionId: 1 
}, { unique: true })

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema)
export default StudentProgress 