import UnitWiseProgress from '../models/unitWiseProgress.js'
import CourseWiseProgress from '../models/courseWiseProgress.js'
import Unit from '../models/unit.js'
import { handleError } from '../utils/errorHandler.js'

// Get unit progress for a student in a course
export const getUnitProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params

    console.log('📊 Getting unit progress for:', { studentId, courseId })

    // Get all units in the course
    const units = await Unit.find({ courseId }).sort({ number: 1 })
    
    if (!units.length) {
      return res.status(200).json({
        success: true,
        data: []
      })
    }

    // Get unit progress records for this student and course
    const unitProgresses = await UnitWiseProgress.find({
      studentId,
      courseId
    })

    // Create a map for quick lookup
    const progressMap = unitProgresses.reduce((acc, progress) => {
      acc[progress.unitId.toString()] = progress
      return acc
    }, {})

    // Combine unit data with progress data
    const unitProgressData = units.map(unit => {
      const progress = progressMap[unit._id.toString()]
      return {
        _id: unit._id,
        name: unit.name,
        number: unit.number,
        progressPercentage: progress ? progress.progressPercentage : 0,
        completedSections: progress ? progress.completedSections : 0,
        totalSections: progress ? progress.totalSections : 0,
        lastUpdated: progress ? progress.lastUpdated : null
      }
    })

    console.log('✅ Unit progress data retrieved:', unitProgressData.length, 'units')

    res.status(200).json({
      success: true,
      data: unitProgressData
    })
  } catch (error) {
    console.error('❌ Error getting unit progress:', error)
    handleError(res, error)
  }
}

// Get course progress for a student
export const getCourseProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params

    console.log('📊 Getting course progress for:', { studentId, courseId })

    // Get course progress record
    const courseProgress = await CourseWiseProgress.findOne({
      studentId,
      courseId
    })

    if (!courseProgress) {
      return res.status(200).json({
        success: true,
        data: {
          progressPercentage: 0,
          completedUnits: 0,
          totalUnits: 0,
          lastUpdated: null
        }
      })
    }

    console.log('✅ Course progress data retrieved:', {
      progressPercentage: courseProgress.progressPercentage,
      completedUnits: courseProgress.completedUnits,
      totalUnits: courseProgress.totalUnits
    })

    res.status(200).json({
      success: true,
      data: {
        progressPercentage: courseProgress.progressPercentage,
        completedUnits: courseProgress.completedUnits,
        totalUnits: courseProgress.totalUnits,
        lastUpdated: courseProgress.lastUpdated
      }
    })
  } catch (error) {
    console.error('❌ Error getting course progress:', error)
    handleError(res, error)
  }
}

// Get all course progress for a student (for dashboard)
export const getAllCourseProgress = async (req, res) => {
  try {
    const { studentId } = req.params

    console.log('📊 Getting all course progress for student:', studentId)

    // Get all course progress records for this student
    const courseProgresses = await CourseWiseProgress.find({
      studentId
    }).populate('courseId', 'name')

    console.log('✅ All course progress data retrieved:', courseProgresses.length, 'courses')

    res.status(200).json({
      success: true,
      data: courseProgresses.map(progress => ({
        courseId: progress.courseId._id,
        courseName: progress.courseId.name,
        progressPercentage: progress.progressPercentage,
        completedUnits: progress.completedUnits,
        totalUnits: progress.totalUnits,
        lastUpdated: progress.lastUpdated
      }))
    })
  } catch (error) {
    console.error('❌ Error getting all course progress:', error)
    handleError(res, error)
  }
} 