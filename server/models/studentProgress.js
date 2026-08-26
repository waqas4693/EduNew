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
  },
  lastAttemptAt: {
    type: Date,
    default: null
  }
})

const viewedResourceSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  number: {
    type: Number,
    default: null
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
  viewedResources: [viewedResourceSchema],
  lastAccessedResource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    default: null
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  // Pre-calculated progress percentages
  resourceProgressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  mcqProgressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { 
  timestamps: true,
  // Add methods to the schema
  methods: {
    // Method to update progress percentages
    async updateProgressPercentages() {
      const Resource = mongoose.model('Resource')

      // Prefer live active resources over SectionStats so deletes cannot freeze progress below 100%
      const activeResources = await Resource.find({
        sectionId: this.sectionId,
        status: 1
      }).select('_id resourceType')

      const totalResources = activeResources.length
      const totalMcqs = activeResources.filter((r) => r.resourceType === 'MCQ').length
      const activeIds = new Set(activeResources.map((r) => String(r._id)))

      const uniqueViewedCount = new Set(
        (this.viewedResources || [])
          .map((item) => String(item.resourceId))
          .filter((id) => activeIds.has(id))
      ).size

      this.resourceProgressPercentage = totalResources > 0
        ? Math.min(Math.round((uniqueViewedCount / totalResources) * 100), 100)
        : 0

      const uniqueCompletedMcqs = new Set(
        (this.mcqProgress || [])
          .filter((item) => item.completed === true && activeIds.has(String(item.resourceId)))
          .map((item) => String(item.resourceId))
      ).size

      this.mcqProgressPercentage = totalMcqs > 0
        ? Math.min(Math.round((uniqueCompletedMcqs / totalMcqs) * 100), 100)
        : 0

      await this.save()
    }
  }
})

// Compound index for quick lookups
studentProgressSchema.index({ 
  studentId: 1, 
  courseId: 1, 
  unitId: 1, 
  sectionId: 1 
}, { unique: true })

// Index for last accessed resource queries
studentProgressSchema.index({ lastAccessedResource: 1 })

// Index for viewed resources
studentProgressSchema.index({ 'viewedResources.resourceId': 1 })

// Compound index for efficient view checking
studentProgressSchema.index({ 
  studentId: 1, 
  courseId: 1, 
  unitId: 1, 
  sectionId: 1, 
  'viewedResources.resourceId': 1 
})

// Index for MCQ progress
studentProgressSchema.index({ 'mcqProgress.resourceId': 1 })

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema)
export default StudentProgress 