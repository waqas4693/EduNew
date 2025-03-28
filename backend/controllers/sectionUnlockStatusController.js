import SectionUnlockStatus from '../models/sectionUnlockStatus.js'
import StudentProgress from '../models/studentProgress.js'
import Section from '../models/section.js'
import Resource from '../models/resource.js'
// Get unlocked sections for a student in a unit
export const getUnlockedSections = async (req, res, next) => {
  try {
    const { studentId, courseId, unitId } = req.params

    // Find or create unlock status
    let unlockStatus = await SectionUnlockStatus.findOne({
      studentId,
      courseId,
      unitId
    })

    // If no unlock status exists, create one with the first section unlocked
    if (!unlockStatus) {
      // Get the first section of the unit
      const sections = await Section.find({ unitId }).sort({ number: 1 }).limit(1)
      
      if (sections.length === 0) {
        return res.status(200).json({ 
          success: true, 
          unlockedSections: [] 
        })
      }

      unlockStatus = await SectionUnlockStatus.create({
        studentId,
        courseId,
        unitId,
        unlockedSections: [sections[0]._id]
      })
    }

    res.status(200).json({
      success: true,
      unlockedSections: unlockStatus.unlockedSections
    })
  } catch (error) {
  }
}

// Check if a section is completed (all MCQs answered correctly)
export const checkSectionCompletion = async (req, res, next) => {
  try {
    const { studentId, courseId, unitId, sectionId } = req.params

    // Get all MCQ resources for the section
    const mcqResources = await Resource.find({
      sectionId,
      resourceType: 'MCQ'
    })

    if (mcqResources.length === 0) {
      return res.status(200).json({
        success: true,
        isCompleted: true,
        message: 'No MCQs in this section'
      })
    }

    // Get student progress for this section
    const studentProgress = await StudentProgress.findOne({
      studentId,
      courseId,
      unitId,
      sectionId
    })

    if (!studentProgress) {
      return res.status(200).json({
        success: true,
        isCompleted: false,
        message: 'No progress found for this section'
      })
    }

    // Check if all MCQs are completed
    const mcqIds = mcqResources.map(resource => resource._id.toString())
    const completedMcqs = studentProgress.mcqProgress
      .filter(progress => progress.completed)
      .map(progress => progress.resourceId.toString())

    // Check if all MCQ IDs are in the completed MCQs list
    const allCompleted = mcqIds.every(id => completedMcqs.includes(id))

    if (allCompleted) {
      // If all MCQs are completed, unlock the next section
      await unlockNextSection(studentId, courseId, unitId, sectionId)
    }

    res.status(200).json({
      success: true,
      isCompleted: allCompleted,
      totalMcqs: mcqIds.length,
      completedMcqs: completedMcqs.length
    })
  } catch (error) {
  }
}

// Helper function to unlock the next section
const unlockNextSection = async (studentId, courseId, unitId, currentSectionId) => {
  try {
    // Get all sections in the unit, sorted by number
    const sections = await Section.find({ unitId }).sort({ number: 1 })
    
    // Find the index of the current section
    const currentIndex = sections.findIndex(
      section => section._id.toString() === currentSectionId
    )
    
    // If this is the last section or not found, return
    if (currentIndex === -1 || currentIndex === sections.length - 1) {
      return
    }
    
    // Get the next section
    const nextSection = sections[currentIndex + 1]
    
    // Update the unlock status to include the next section
    await SectionUnlockStatus.findOneAndUpdate(
      { studentId, courseId, unitId },
      { 
        $addToSet: { unlockedSections: nextSection._id },
        lastUpdated: Date.now()
      },
      { upsert: true }
    )
  } catch (error) {
    console.error('Error unlocking next section:', error)
  }
}

// Manually unlock a specific section (for admin use)
export const unlockSection = async (req, res, next) => {
  try {
    const { studentId, courseId, unitId, sectionId } = req.params
    
    await SectionUnlockStatus.findOneAndUpdate(
      { studentId, courseId, unitId },
      { 
        $addToSet: { unlockedSections: sectionId },
        lastUpdated: Date.now()
      },
      { upsert: true }
    )
    
    res.status(200).json({
      success: true,
      message: 'Section unlocked successfully'
    })
  } catch (error) {
  }
} 