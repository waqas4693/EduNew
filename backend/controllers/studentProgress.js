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
      // If there is no progress record found
      // then this means that the student is new to the section 
      // therefore a new progress object in the database must be created
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

    const updateObj = {
      lastAccessedResource: resourceId,
      lastAccessedAt: new Date()
    }

    if (mcqData) {
      updateObj.$addToSet = {
        viewedResources: { resourceId: resourceId, resourceNumber },
        mcqProgress: {
          resourceId: resourceId,
          resourceNumber,
          completed: mcqData.completed,
          attempts: mcqData.attempts,
          completedAt: mcqData.completed ? new Date() : null,
          lastAttemptAt: new Date()
        }
      }
    } else {
      updateObj.$addToSet = { viewedResources: { resourceId: resourceId, resourceNumber } }
    }

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