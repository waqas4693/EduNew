import CourseStats from '../models/courseStats.js'
import UnitStats from '../models/unitStats.js'
import SectionStats from '../models/sectionStats.js'
import Resource from '../models/resource.js'
import Section from '../models/section.js'
import Unit from '../models/unit.js'
import { handleError } from '../utils/errorHandler.js'

// Course Stats Controllers
export const getCourseStats = async (req, res) => {
  try {
    const { courseId } = req.params
    const stats = await CourseStats.findOne({ courseId })
    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * Recalculates course stats by counting actual units
 * Use this function to ensure data consistency or recover from inconsistencies
 */
export const recalculateCourseStats = async (courseId) => {
  try {
    const totalUnits = await Unit.countDocuments({ courseId, status: 1 })
    await CourseStats.findOneAndUpdate(
      { courseId },
      { totalUnits },
      { upsert: true }
    )
    return totalUnits
  } catch (error) {
    console.error('Error recalculating course stats:', error)
    throw error
  }
}

// Unit Stats Controllers
export const getUnitStats = async (req, res) => {
  try {
    const { unitId } = req.params
    const stats = await UnitStats.findOne({ unitId })
    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * Recalculates unit stats by counting actual sections
 * Use this function to ensure data consistency or recover from inconsistencies
 */
export const recalculateUnitStats = async (unitId) => {
  try {
    const totalSections = await Section.countDocuments({ unitId, status: 1 })
    await UnitStats.findOneAndUpdate(
      { unitId },
      { totalSections },
      { upsert: true }
    )
    return totalSections
  } catch (error) {
    console.error('Error recalculating unit stats:', error)
    throw error
  }
}

// Section Stats Controllers
export const getSectionStats = async (req, res) => {
  try {
    const { sectionId } = req.params
    const stats = await SectionStats.findOne({ sectionId })
    res.status(200).json({ success: true, data: stats })
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * Recalculates section stats by counting actual resources and MCQs
 * Use this function to ensure data consistency or recover from inconsistencies
 */
export const recalculateSectionStats = async (sectionId) => {
  try {
    // Get total resources and MCQs
    const [totalResources, totalMcqs, totalAssessments] = await Promise.all([
      Resource.countDocuments({ sectionId, status: 1 }),
      Resource.countDocuments({ sectionId, status: 1, resourceType: 'MCQ' }),
      Resource.countDocuments({ sectionId, status: 1, resourceType: 'ASSESSMENT' })
    ])

    // Update section stats
    await SectionStats.findOneAndUpdate(
      { sectionId },
      { 
        totalResources,
        totalMcqs,
        totalAssessments
      },
      { upsert: true }
    )
    return { totalResources, totalMcqs, totalAssessments }
  } catch (error) {
    console.error('Error recalculating section stats:', error)
    throw error
  }
}

export const recalculateAllStats = async (courseId) => {
  try {
    // Get all units in the course
    const units = await Unit.find({ courseId, status: 1 })
    
    // Recalculate course stats
    await recalculateCourseStats(courseId)
    
    // Recalculate stats for each unit and its sections
    for (const unit of units) {
      await recalculateUnitStats(unit._id)
      
      // Get all sections in the unit
      const sections = await Section.find({ unitId: unit._id, status: 1 })
      
      // Recalculate stats for each section
      for (const section of sections) {
        await recalculateSectionStats(section._id)
      }
    }
  } catch (error) {
    console.error('Error recalculating all stats:', error)
    throw error
  }
}