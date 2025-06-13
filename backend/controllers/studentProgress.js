import StudentProgress from '../models/studentProgress.js'
import Resource from '../models/resource.js'
import SectionStats from '../models/sectionStats.js'
import { handleError } from '../utils/errorHandler.js'
import mongoose from 'mongoose'

// Get student progress for a specific section
export const getStudentSectionProgress = async (req, res) => {
  try {
    const { studentId, courseId, unitId, sectionId } = req.params

    // Find or create progress record
    let progress = await StudentProgress.findOne({
      studentId,
      courseId,
      unitId,
      sectionId
    }).populate('mcqProgress.resourceId')

    if (!progress) {
      // If no progress record exists, create a new one
      progress = new StudentProgress({
        studentId,
        courseId,
        unitId,
        sectionId,
        mcqProgress: [],
        viewedResources: []
      })
      await progress.save()
    }

    // Get section stats for validation
    const sectionStats = await SectionStats.findOne({ sectionId })
    if (!sectionStats) {
      return res.status(404).json({
        success: false,
        message: 'Section stats not found'
      })
    }

    // Update progress percentages if they're out of sync
    if (progress.lastAccessedAt && 
        (Date.now() - progress.lastAccessedAt > 5 * 60 * 1000)) { // 5 minutes
      await progress.updateProgressPercentages()
    }

    // Get last accessed resource details if exists
    let lastResourceDetails = null
    if (progress.lastAccessedResource) {
      const lastResource = await Resource.findOne({ 
        _id: progress.lastAccessedResource,
        status: 1
      })
      if (lastResource) {
        lastResourceDetails = {
          _id: lastResource._id,
          name: lastResource.name,
          number: lastResource.number,
          resourceType: lastResource.resourceType
        }
      }
    }

    // Ensure we have the latest progress data
    const progressData = await StudentProgress.findById(progress._id)

    res.status(200).json({
      success: true,
      data: {
        progress: {
          ...progressData.toObject(),
          lastResourceDetails
        },
        totalResources: sectionStats.totalResources,
        totalMcqs: sectionStats.totalMcqs,
        resourceProgressPercentage: progressData.resourceProgressPercentage,
        mcqProgressPercentage: progressData.mcqProgressPercentage
      }
    })
  } catch (error) {
    console.error('Error in getStudentSectionProgress:', error)
    handleError(res, error)
  }
}

// Update progress (MCQ and/or resource view)
export const updateProgress = async (req, res) => {
  try {
    const { studentId, courseId, unitId, sectionId } = req.params
    const { resourceId, resourceNumber, mcqData } = req.body

    console.log('Received request data:', {
      params: { studentId, courseId, unitId, sectionId },
      body: { resourceId, resourceNumber, mcqData }
    })

    // Convert resourceId to ObjectId
    let resourceObjectId
    try {
      resourceObjectId = new mongoose.Types.ObjectId(resourceId)
      console.log('Successfully converted resourceId to ObjectId:', resourceObjectId)
    } catch (error) {
      console.error('Error converting resourceId to ObjectId:', error)
      return res.status(400).json({
        success: false,
        message: 'Invalid resource ID format',
        error: error.message
      })
    }

    // Get section stats for total counts
    const sectionStats = await SectionStats.findOne({ sectionId })
    console.log('Section stats found:', sectionStats)
    
    if (!sectionStats) {
      return res.status(404).json({
        success: false,
        message: 'Section stats not found'
      })
    }

    // Prepare update object
    const updateObj = {
      lastAccessedResource: resourceObjectId,
      lastAccessedAt: new Date()
    }

    // Only add to viewedResources if this is not an MCQ update
    if (!mcqData) {
      updateObj.$addToSet = { viewedResources: { resourceId: resourceObjectId, resourceNumber } }
    }

    // Add MCQ progress if provided
    if (mcqData) {
      updateObj.$push = {
        mcqProgress: {
          resourceId: resourceObjectId,
          resourceNumber,
          completed: mcqData.completed,
          attempts: mcqData.attempts
        }
      }
    }

    console.log('Update object prepared:', JSON.stringify(updateObj, null, 2))

    // Update progress
    const progress = await StudentProgress.findOneAndUpdate(
      {
        studentId,
        courseId,
        unitId,
        sectionId
      },
      updateObj,
      {
        new: true,
        upsert: true
      }
    )

    console.log('Progress document after update:', progress)

    // Calculate updated percentages
    const resourceProgressPercentage = Math.round(
      (progress.viewedResources.length / sectionStats.totalResources) * 100
    )

    // Only calculate MCQ progress if there are MCQs in the section
    let mcqProgressPercentage = 0
    let completedMcqs = 0
    
    if (sectionStats.totalMcqs > 0) {
      completedMcqs = progress.mcqProgress.filter(mcq => mcq.completed).length
      mcqProgressPercentage = Math.round(
        (completedMcqs / sectionStats.totalMcqs) * 100
      )
    }

    console.log('Calculated percentages:', {
      resourceProgressPercentage,
      mcqProgressPercentage,
      completedMcqs,
      totalMcqs: sectionStats.totalMcqs
    })

    // Update the progress document with the calculated percentages
    const finalProgress = await StudentProgress.findByIdAndUpdate(
      progress._id,
      {
        resourceProgressPercentage,
        mcqProgressPercentage,
        lastAccessedAt: new Date()
      },
      { new: true }
    )

    console.log('Final progress document:', finalProgress)

    res.status(200).json({
      success: true,
      data: {
        progress: {
          resourceProgressPercentage,
          mcqProgressPercentage,
          totalResources: sectionStats.totalResources,
          totalMcqs: sectionStats.totalMcqs,
          completedMcqs,
          viewedResources: progress.viewedResources.length,
          lastAccessedResource: resourceId
        }
      }
    })
  } catch (error) {
    console.error('Error in updateProgress:', error)
    handleError(res, error)
  }
}

// Get overall MCQ progress for a course
export const getCourseMcqProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params

    // Get all progress records for this student and course
    const progressRecords = await StudentProgress.find({
      studentId,
      courseId
    })

    // Calculate total MCQs and completed MCQs
    let totalMcqs = 0
    let completedMcqs = 0
    let totalProgressPercentage = 0

    // Get all section stats for this course
    const sectionIds = progressRecords.map(record => record.sectionId)
    const sectionStats = await SectionStats.find({
      sectionId: { $in: sectionIds }
    })

    // Create a map of section stats for quick lookup
    const statsMap = sectionStats.reduce((acc, stat) => {
      acc[stat.sectionId.toString()] = stat
      return acc
    }, {})

    // Calculate overall progress
    progressRecords.forEach(record => {
      const sectionStat = statsMap[record.sectionId.toString()]
      if (sectionStat) {
        totalMcqs += sectionStat.totalMcqs
        completedMcqs += record.mcqProgress.filter(mcq => mcq.completed).length
      }
    })

    const progressPercentage = totalMcqs > 0 
      ? Math.round((completedMcqs / totalMcqs) * 100) 
      : 0

    res.status(200).json({
      success: true,
      data: {
        totalMcqs,
        completedMcqs,
        progressPercentage
      }
    })
  } catch (error) {
    handleError(res, error)
  }
} 