import mongoose from 'mongoose'

const resourceViewSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
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
  viewedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false })

// Compound index to ensure unique views per student-resource combination
resourceViewSchema.index({ studentId: 1, resourceId: 1 }, { unique: true })

const ResourceView = mongoose.model('ResourceView', resourceViewSchema)
export default ResourceView 