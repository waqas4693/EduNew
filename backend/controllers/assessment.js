import { handleError } from '../utils/errorHandler.js'
import Assessment from '../models/assessment.js'
import Section from '../models/section.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import Course from '../models/course.js'

export const createAssessment = async (req, res) => {
  try {
    const { sectionId, courseId, isTimeBound, timeAllowed } = req.body

    if (req.body.assessmentType === 'MCQ' && isTimeBound) {
      if (!timeAllowed || timeAllowed <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Time allowed must be a positive number for time-bound assessments'
        })
      }
    }

    // Get and update course assessment count
    const course = await Course.findByIdAndUpdate(
      courseId,
      { $inc: { totalAssessments: 1 } },
      { new: true }
    )

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      })
    }

    const existingAssessments = await Assessment.find({ sectionId })
    const totalPercentage = existingAssessments.reduce(
      (sum, assessment) => sum + assessment.percentage,
      0
    )

    if (totalPercentage + Number(req.body.percentage) > 100) {
      return res.status(400).json({
        success: false,
        message: 'Total percentage cannot exceed 100%'
      })
    }

    const assessment = new Assessment({
      ...req.body,
      orderNumber: course.totalAssessments
    })
    
    const savedAssessment = await assessment.save()

    await Section.findByIdAndUpdate(
      sectionId,
      { $push: { assessments: savedAssessment._id } }
    )

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessment: savedAssessment
    })
  } catch (error) {
    console.log('Error Creating Assessment:', error)
    handleError(error, res)
  }
}

export const getAssessments = async (req, res) => {
  try {
    const { sectionId } = req.params
    const studentId = req.query.studentId

    console.log('Fetching assessments for:', { sectionId, studentId })

    // Get all assessments for the section
    const assessments = await Assessment.find({ sectionId })
    console.log('Found assessments:', assessments.length)

    if (studentId) {
      // Get all attempts for these assessments by this student
      const attempts = await AssessmentAttempt.find({
        assessmentId: { $in: assessments.map(a => a._id) },
        studentId: studentId
      })
      console.log('Found attempts:', attempts.length)

      // Create a map of attempts by assessment ID for easier lookup
      const attemptsByAssessment = attempts.reduce((acc, attempt) => {
        acc[attempt.assessmentId.toString()] = attempt
        return acc
      }, {})

      // Add attempt data to each assessment
      const assessmentsWithAttempts = assessments.map(assessment => {
        const assessmentObj = assessment.toObject()
        const attempt = attemptsByAssessment[assessment._id.toString()]
        return {
          ...assessmentObj,
          attempt: attempt || null
        }
      })

      console.log('Sending assessments with attempts:', assessmentsWithAttempts.length)
      return res.status(200).json({
        success: true,
        assessments: assessmentsWithAttempts
      })
    }

    res.status(200).json({
      success: true,
      assessments
    })
  } catch (error) {
    console.error('Error in getAssessments:', error)
    handleError(error, res)
  }
}

export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params
    const {
      assessmentType,
      totalMarks,
      percentage,
      isTimeBound,
      timeAllowed,
      content
    } = req.body

    const assessment = await Assessment.findByIdAndUpdate(
      id,
      { 
        assessmentType,
        totalMarks,
        percentage,
        isTimeBound,
        timeAllowed,
        content,
        updatedAt: Date.now()
      },
      { new: true }
    )

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      })
    }

    res.status(200).json({
      success: true,
      data: assessment
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params
    const assessment = await Assessment.findByIdAndDelete(id)

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    })
  } catch (error) {
    handleError(error, res)
  }
}
