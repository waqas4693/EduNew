import CourseStats from '../models/courseStats.js'
import UnitStats from '../models/unitStats.js'
import SectionStats from '../models/sectionStats.js'
import Resource from '../models/resource.js'
import Section from '../models/section.js'
import Unit from '../models/unit.js'
import { handleError } from '../utils/errorHandler.js'
import Course from '../models/course.js'

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

/**
 * Counts and updates stats for all existing data
 * This is a one-time function to populate stats for existing data
 */
export const countAllExistingStats = async () => {
  try {
    console.log('Starting to count all existing stats...')
    
    // Get all courses
    const courses = await Course.find({ status: 1 })
    console.log(`Found ${courses.length} active courses`)
    
    for (const course of courses) {
      // Count units for this course
      const totalUnits = await Unit.countDocuments({ courseId: course._id, status: 1 })
      await CourseStats.findOneAndUpdate(
        { courseId: course._id },
        { totalUnits },
        { upsert: true }
      )
      console.log(`Updated CourseStats for course ${course._id} with ${totalUnits} units`)
      
      // Get all units for this course
      const units = await Unit.find({ courseId: course._id, status: 1 })
      
      for (const unit of units) {
        // Count sections for this unit
        const totalSections = await Section.countDocuments({ unitId: unit._id, status: 1 })
        await UnitStats.findOneAndUpdate(
          { unitId: unit._id },
          { totalSections },
          { upsert: true }
        )
        console.log(`Updated UnitStats for unit ${unit._id} with ${totalSections} sections`)
        
        // Get all sections for this unit
        const sections = await Section.find({ unitId: unit._id, status: 1 })
        
        for (const section of sections) {
          // Count resources and MCQs for this section
          const [totalResources, totalMcqs, totalAssessments] = await Promise.all([
            Resource.countDocuments({ sectionId: section._id, status: 1 }),
            Resource.countDocuments({ sectionId: section._id, status: 1, resourceType: 'MCQ' }),
            Resource.countDocuments({ sectionId: section._id, status: 1, resourceType: 'ASSESSMENT' })
          ])
          
          await SectionStats.findOneAndUpdate(
            { sectionId: section._id },
            { 
              totalResources,
              totalMcqs,
              totalAssessments
            },
            { upsert: true }
          )
          console.log(`Updated SectionStats for section ${section._id} with ${totalResources} resources, ${totalMcqs} MCQs, and ${totalAssessments} assessments`)
        }
      }
    }
    
    console.log('Finished counting all existing stats')
  } catch (error) {
    console.error('Error counting existing stats:', error)
    throw error
  }
}