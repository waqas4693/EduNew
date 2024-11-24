import AssessmentAttempt from '../models/AssessmentAttempt.js'
import Assessment from '../models/assessment.js'
import { handleError } from '../utils/errorHandler.js'

export const submitAttempt = async (req, res) => {
  try {
    const { assessmentId, studentId, content } = req.body

    const assessment = await Assessment.findById(assessmentId)
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      })
    }

    const existingAttempt = await AssessmentAttempt.findOne({
      assessmentId,
      studentId,
      status: { $in: ['PENDING', 'SUBMITTED'] }
    })

    if (existingAttempt) {
      existingAttempt.content = content
      existingAttempt.status = 'SUBMITTED'
      existingAttempt.submittedAt = new Date()
      await existingAttempt.save()

      return res.status(200).json({
        success: true,
        message: 'Assessment attempt updated successfully',
        attempt: existingAttempt
      })
    }

    const attempt = new AssessmentAttempt({
      assessmentId,
      studentId,
      content,
      status: 'SUBMITTED',
      submittedAt: new Date()
    })

    await attempt.save()

    res.status(201).json({
      success: true,
      message: 'Assessment submitted successfully',
      attempt
    })
  } catch (error) {
    // handleError(error, res)
    console.log('Attempt Assessment Controller Error')
    console.log(error)
  }
}

export const getAttemptByStudent = async (req, res) => {
  try {
    const { assessmentId } = req.params
    const { studentId } = req.query

    const attempt = await AssessmentAttempt.findOne({
      assessmentId,
      studentId
    })

    res.status(200).json({
      success: true,
      attempt
    })
  } catch (error) {
    handleError(error, res)
  }
} 