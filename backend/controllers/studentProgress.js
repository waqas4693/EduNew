import StudentProgress from '../models/studentProgress.js'
import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'

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
        mcqProgress: []
      })
      await progress.save()
    }

    // Get all MCQ resources in this section
    const mcqResources = await Resource.find({
      sectionId,
      resourceType: 'MCQ',
      status: 1
    }).sort('createdAt')

    // Calculate progress statistics
    const totalMcqs = mcqResources.length
    const completedMcqs = progress.mcqProgress.filter(p => p.completed).length
    const mcqProgressPercentage = totalMcqs > 0 ? Math.round((completedMcqs / totalMcqs) * 100) : 0

    // Find the next uncompleted MCQ
    let nextMcqIndex = 0
    if (progress.mcqProgress.length > 0) {
      // Create a map of completed MCQs
      const completedMap = {}
      progress.mcqProgress.forEach(p => {
        if (p.completed && p.resourceId) {
          completedMap[p.resourceId._id.toString()] = true
        }
      })

      // Find the first uncompleted MCQ
      for (let i = 0; i < mcqResources.length; i++) {
        if (!completedMap[mcqResources[i]._id.toString()]) {
          nextMcqIndex = i
          break
        }
        // If all MCQs are completed, point to the last one
        if (i === mcqResources.length - 1) {
          nextMcqIndex = i
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        progress,
        totalMcqs,
        completedMcqs,
        mcqProgressPercentage,
        nextMcqIndex,
        nextMcqId: mcqResources[nextMcqIndex]?._id || null
      }
    })
  } catch (error) {
    handleError(res, error)
  }
}

// Update MCQ progress
export const updateMcqProgress = async (req, res) => {
  try {
    const { studentId, courseId, unitId, sectionId, resourceId } = req.params
    const { completed, attempts } = req.body

    // Find or create progress record
    let progress = await StudentProgress.findOne({
      studentId,
      courseId,
      unitId,
      sectionId
    })

    if (!progress) {
      progress = new StudentProgress({
        studentId,
        courseId,
        unitId,
        sectionId,
        mcqProgress: []
      })
    }

    // Check if this MCQ is already in the progress array
    const mcqIndex = progress.mcqProgress.findIndex(
      p => p.resourceId.toString() === resourceId
    )

    if (mcqIndex === -1) {
      // Add new MCQ progress
      progress.mcqProgress.push({
        resourceId,
        completed,
        completedAt: completed ? new Date() : null,
        attempts: attempts || 1
      })
    } else {
      // Update existing MCQ progress
      progress.mcqProgress[mcqIndex].attempts = (progress.mcqProgress[mcqIndex].attempts || 0) + 1
      
      if (completed && !progress.mcqProgress[mcqIndex].completed) {
        progress.mcqProgress[mcqIndex].completed = true
        progress.mcqProgress[mcqIndex].completedAt = new Date()
      }
    }

    // Update last accessed resource
    progress.lastAccessedResource = resourceId
    progress.lastAccessedAt = new Date()

    await progress.save()

    res.status(200).json({
      success: true,
      data: progress
    })
  } catch (error) {
    handleError(res, error)
  }
}

// Update last accessed resource
export const updateLastAccessedResource = async (req, res) => {
  try {
    const { studentId, courseId, unitId, sectionId } = req.params
    const { resourceId } = req.body

    // Find or create progress record
    let progress = await StudentProgress.findOne({
      studentId,
      courseId,
      unitId,
      sectionId
    })

    if (!progress) {
      progress = new StudentProgress({
        studentId,
        courseId,
        unitId,
        sectionId,
        mcqProgress: []
      })
    }

    // Update last accessed resource
    progress.lastAccessedResource = resourceId
    progress.lastAccessedAt = new Date()

    await progress.save()

    res.status(200).json({
      success: true,
      data: progress
    })
  } catch (error) {
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

    progressRecords.forEach(record => {
      record.mcqProgress.forEach(mcq => {
        totalMcqs++
        if (mcq.completed) {
          completedMcqs++
        }
      })
    })

    const progressPercentage = totalMcqs > 0 ? Math.round((completedMcqs / totalMcqs) * 100) : 0

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