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
      const SectionStats = mongoose.model('SectionStats')
      
      // Get section stats
      const sectionStats = await SectionStats.findOne({ sectionId: this.sectionId })
      if (!sectionStats) return

      // Update resource progress percentage based on viewed resources count
      const viewedResourcesCount = this.viewedResources.length
      this.resourceProgressPercentage = sectionStats.totalResources > 0
        ? Math.round((viewedResourcesCount / sectionStats.totalResources) * 100)
        : 0

      // Update MCQ progress percentage based on completed MCQs
      const completedMcqs = this.mcqProgress.filter(p => p.completed).length
      this.mcqProgressPercentage = sectionStats.totalMcqs > 0
        ? Math.round((completedMcqs / sectionStats.totalMcqs) * 100)
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

// Index for MCQ progress
studentProgressSchema.index({ 'mcqProgress.resourceId': 1 })

// Pre-save middleware to ensure percentages are within bounds
studentProgressSchema.pre('save', function(next) {
  this.resourceProgressPercentage = Math.min(Math.max(this.resourceProgressPercentage, 0), 100)
  this.mcqProgressPercentage = Math.min(Math.max(this.mcqProgressPercentage, 0), 100)
  next()
})

const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema)
export default StudentProgress 