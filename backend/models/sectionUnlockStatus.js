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
  unlockedUnits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }],
  unlockedSections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  methods: {
    // Check if a unit is unlocked
    isUnitUnlocked(unitId) {
      return this.unlockedUnits.includes(unitId)
    },
    
    // Check if a section is unlocked
    isSectionUnlocked(sectionId) {
      return this.unlockedSections.includes(sectionId)
    },
    
    // Unlock a unit
    async unlockUnit(unitId) {
      if (!this.isUnitUnlocked(unitId)) {
        this.unlockedUnits.push(unitId)
        this.lastUpdated = new Date()
        await this.save()
      }
    },
    
    // Unlock a section
    async unlockSection(sectionId) {
      if (!this.isSectionUnlocked(sectionId)) {
        this.unlockedSections.push(sectionId)
        this.lastUpdated = new Date()
        await this.save()
      }
    }
  }
})

// Compound index for quick lookups
sectionUnlockStatusSchema.index({ 
  studentId: 1, 
  courseId: 1
}, { unique: true })

// Index for unlocked units and sections
sectionUnlockStatusSchema.index({ unlockedUnits: 1 })
sectionUnlockStatusSchema.index({ unlockedSections: 1 })

const SectionUnlockStatus = mongoose.model('SectionUnlockStatus', sectionUnlockStatusSchema)
export default SectionUnlockStatus 