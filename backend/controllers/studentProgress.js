import StudentProgress from '../models/studentProgress.js'

import { handleError } from '../utils/errorHandler.js'

export const getStudentProgress = async (req, res) => {
  try {
    const { studentId, courseId, unitId, sectionId } = req.params

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
        mcqProgress: [],
        viewedResources: []
      })
      await progress.save()
    }

    res.status(200).json({
      success: true,
      progress
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateStudentProgress = async (req, res) => {
  try {
    const { studentId, courseId, unitId, sectionId } = req.params
    const { resourceId, resourceNumber, mcqData } = req.body

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'resourceId is required'
      })
    }

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
        mcqProgress: [],
        viewedResources: []
      })
    }

    progress.lastAccessedResource = resourceId
    progress.lastAccessedAt = new Date()

    const alreadyViewed = progress.viewedResources.some(
      (item) => String(item.resourceId) === String(resourceId)
    )

    if (!alreadyViewed) {
      progress.viewedResources.push({
        resourceId,
        resourceNumber,
        viewedAt: new Date()
      })
    }

    if (mcqData) {
      const existingMcqIndex = progress.mcqProgress.findIndex(
        (item) => String(item.resourceId) === String(resourceId)
      )

      const mcqEntry = {
        resourceId,
        resourceNumber,
        completed: Boolean(mcqData.completed),
        attempts: mcqData.attempts ?? 0,
        completedAt: mcqData.completed ? new Date() : null,
        lastAttemptAt: new Date()
      }

      if (existingMcqIndex >= 0) {
        const existing = progress.mcqProgress[existingMcqIndex]
        progress.mcqProgress[existingMcqIndex] = {
          ...existing.toObject?.() ?? existing,
          ...mcqEntry,
          // Never downgrade a completed MCQ back to incomplete
          completed: existing.completed || mcqEntry.completed,
          completedAt: existing.completed
            ? existing.completedAt
            : mcqEntry.completedAt,
          attempts: Math.max(existing.attempts || 0, mcqEntry.attempts || 0)
        }
      } else {
        progress.mcqProgress.push(mcqEntry)
      }
    }

    await progress.save()
    await progress.updateProgressPercentages()

    const updatedProgress = await StudentProgress.findById(progress._id)

    res.status(200).json({
      success: true,
      progress: updatedProgress
    })
  } catch (error) {
    handleError(res, error)
  }
}
