import mongoose from 'mongoose'

const completedSectionsSchema = new mongoose.Schema({
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
  status: {
    type: Number,
    required: true,
    enum: [0, 1],
    default: 1,
  }
}, { timestamps: true })

completedSectionsSchema.index(
  {
    studentId: 1,
    courseId: 1,
    unitId: 1,
    sectionId: 1,
  },
  { unique: true }
)

completedSectionsSchema.index({ studentId: 1, courseId: 1 })
completedSectionsSchema.index({ studentId: 1, courseId: 1, unitId: 1 })
completedSectionsSchema.index({ studentId: 1, courseId: 1, unitId: 1, status: 1 })
completedSectionsSchema.index({ sectionId: 1 })

const CompletedSections = mongoose.model('CompletedSections', completedSectionsSchema)
export default CompletedSections

