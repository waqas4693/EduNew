import UnitWiseProgress from '../models/unitWiseProgress.js'
import CourseWiseProgress from '../models/courseWiseProgress.js'
import StudentProgress from '../models/studentProgress.js'
import Section from '../models/section.js'
import Unit from '../models/unit.js'

// Calculate and save unit progress
export const calculateAndSaveUnitProgress = async (studentId, courseId, unitId) => {
  try {
    console.log('🔄 Calculating unit progress for:', { studentId, courseId, unitId })

    // Get all sections in this unit
    const sections = await Section.find({ unitId }).sort({ number: 1 })
    const totalSections = sections.length

    if (totalSections === 0) {
      console.log('⚠️ No sections found for unit:', unitId)
      return
    }

    // Get progress for all sections in this unit
    const sectionProgresses = await StudentProgress.find({
      studentId,
      courseId,
      unitId
    })

    // Count completed sections (sections with 100% resource progress)
    let completedSections = 0
    for (const section of sections) {
      const sectionProgress = sectionProgresses.find(
        sp => sp.sectionId.toString() === section._id.toString()
      )
      
      if (sectionProgress && sectionProgress.resourceProgressPercentage >= 100) {
        completedSections++
      }
    }

    // Calculate unit progress percentage
    const progressPercentage = totalSections > 0 
      ? Math.round((completedSections / totalSections) * 100)
      : 0

    console.log('📊 Unit progress calculation:', {
      completedSections,
      totalSections,
      progressPercentage
    })

    // Save or update unit progress
    await UnitWiseProgress.findOneAndUpdate(
      { studentId, courseId, unitId },
      {
        progressPercentage,
        completedSections,
        totalSections,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    )

    console.log('✅ Unit progress saved successfully')

    // Calculate and save course progress
    await calculateAndSaveCourseProgress(studentId, courseId)

  } catch (error) {
    console.error('❌ Error calculating unit progress:', error)
    throw error
  }
}

// Calculate and save course progress
export const calculateAndSaveCourseProgress = async (studentId, courseId) => {
  try {
    console.log('🔄 Calculating course progress for:', { studentId, courseId })

    // Get all units in this course
    const units = await Unit.find({ courseId }).sort({ number: 1 })
    const totalUnits = units.length

    if (totalUnits === 0) {
      console.log('⚠️ No units found for course:', courseId)
      return
    }

    // Get all unit progress records for this course
    const unitProgresses = await UnitWiseProgress.find({
      studentId,
      courseId
    })

    // Count completed units (units with 100% progress)
    let completedUnits = 0
    for (const unit of units) {
      const unitProgress = unitProgresses.find(
        up => up.unitId.toString() === unit._id.toString()
      )
      
      if (unitProgress && unitProgress.progressPercentage >= 100) {
        completedUnits++
      }
    }

    // Calculate course progress percentage
    const progressPercentage = totalUnits > 0 
      ? Math.round((completedUnits / totalUnits) * 100)
      : 0

    console.log('📊 Course progress calculation:', {
      completedUnits,
      totalUnits,
      progressPercentage
    })

    // Save or update course progress
    await CourseWiseProgress.findOneAndUpdate(
      { studentId, courseId },
      {
        progressPercentage,
        completedUnits,
        totalUnits,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    )

    console.log('✅ Course progress saved successfully')

  } catch (error) {
    console.error('❌ Error calculating course progress:', error)
    throw error
  }
} 