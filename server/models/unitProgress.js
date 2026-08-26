import mongoose from 'mongoose'

const unitProgressSchema = new mongoose.Schema({
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
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { timestamps: true })

unitProgressSchema.index({ 
  studentId: 1, 
  courseId: 1, 
  unitId: 1 
}, { unique: true })

unitProgressSchema.index({ studentId: 1, courseId: 1 })

const UnitProgress = mongoose.model('UnitProgress', unitProgressSchema)
export default UnitProgress
