import AssessmentAttempt from '../models/AssessmentAttempt.js'
import Assessment from '../models/assessment.js'
import { handleError } from '../utils/errorHandler.js'
import { calculateMcqMarks } from '../utils/mcqScoring.js'

const buildAttemptPayload = (assessment, content) => {
  const basePayload = {
    content,
    submittedAt: new Date()
  }

  if (assessment.assessmentType !== 'MCQ') {
    return {
      ...basePayload,
      status: 'SUBMITTED'
    }
  }

  const grading = calculateMcqMarks(
    assessment.content?.mcqs || [],
    content?.mcqAnswers || [],
    assessment.totalMarks
  )

  return {
    ...basePayload,
    status: 'GRADED',
    obtainedMarks: grading.calculatedMarks,
    statusHistory: [
      {
        status: 'GRADED',
        comments: `Auto-graded with ${grading.calculatedMarks} of ${assessment.totalMarks} marks`,
        timestamp: new Date()
      }
    ]
  }
}

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

    const attemptPayload = buildAttemptPayload(assessment, content)

    const existingAttempt = await AssessmentAttempt.findOne({
      assessmentId,
      studentId
    })

    if (existingAttempt) {
      Object.assign(existingAttempt, attemptPayload)
      await existingAttempt.save()

      return res.status(200).json({
        success: true,
        message:
          assessment.assessmentType === 'MCQ'
            ? 'Assessment submitted and graded successfully'
            : 'Assessment attempt updated successfully',
        attempt: existingAttempt
      })
    }

    const attempt = new AssessmentAttempt({
      assessmentId,
      studentId,
      ...attemptPayload
    })

    await attempt.save()

    res.status(201).json({
      success: true,
      message:
        assessment.assessmentType === 'MCQ'
          ? 'Assessment submitted and graded successfully'
          : 'Assessment submitted successfully',
      attempt
    })
  } catch (error) {
    handleError(res, error)
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
    handleError(res, error)
  }
}
