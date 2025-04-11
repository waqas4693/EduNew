import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseStatus: {
    type: Number,
    enum: [1, 2, 3],
    default: 1
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  }
})

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  contactNo: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    enum: [1, 2],
    default: 1
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  courses: [courseSchema]
}, { timestamps: false })

const Student = mongoose.model('Student', studentSchema)
export default Student
