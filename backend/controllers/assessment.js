import { handleError } from '../utils/errorHandler.js'
import Assessment from '../models/assessment.js'
import Section from '../models/section.js'

export const createAssessment = async (req, res) => {
  try {
    const { sectionId, isTimeBound, timeAllowed } = req.body

    if (req.body.assessmentType === 'MCQ' && isTimeBound) {
      if (!timeAllowed || timeAllowed <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Time allowed must be a positive number for time-bound assessments'
        })
      }
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

    const assessment = new Assessment(req.body)
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
    console.log('Error Testing Assessment:', error)
    handleError(error, res)
  }
}

export const getAssessments = async (req, res) => {
  try {
    const { sectionId } = req.params
    const assessments = await Assessment.find({ sectionId })

    res.status(200).json({
      success: true,
      assessments
    })
  } catch (error) {
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
