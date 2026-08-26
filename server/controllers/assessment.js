import { handleError } from '../utils/errorHandler.js'
import Assessment from '../models/assessment.js'
import Section from '../models/section.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import Course from '../models/course.js'
import { uploadToS3 } from './s3.js'

const parseAssessmentContent = (rawContent) => {
  if (typeof rawContent === 'string') {
    return JSON.parse(rawContent)
  }

  return rawContent
}

const uploadMcqFiles = async (mcqs = [], files = []) =>
  Promise.all(
    mcqs.map(async (mcq, index) => {
      const updatedMcq = { ...mcq }

      const imageFile = files.find((file) => file.fieldname === `mcqImage_${index}`)
      if (imageFile) {
        updatedMcq.imageFile = await uploadToS3(
          imageFile,
          'MCQ_IMAGES',
          `${Date.now()}-${imageFile.originalname}`
        )
      }

      const audioFile = files.find((file) => file.fieldname === `mcqAudio_${index}`)
      if (audioFile) {
        updatedMcq.audioFile = await uploadToS3(
          audioFile,
          'MCQ_AUDIO',
          `${Date.now()}-${audioFile.originalname}`
        )
      }

      return updatedMcq
    })
  )

const uploadFileAssessmentAssets = async (content = {}, files = []) => {
  const updatedContent = { ...content }

  const assessmentFile = files.find((file) => file.fieldname === 'assessmentFile')
  if (assessmentFile) {
    updatedContent.assessmentFile = await uploadToS3(
      assessmentFile,
      'ASSESSMENT_FILES',
      `${Date.now()}-${assessmentFile.originalname}`
    )
  }

  const supportingFile = files.find((file) => file.fieldname === 'supportingFile')
  if (supportingFile) {
    updatedContent.supportingFile = await uploadToS3(
      supportingFile,
      'ASSESSMENT_FILES',
      `${Date.now()}-${supportingFile.originalname}`
    )
  }

  return updatedContent
}

export const createAssessment = async (req, res) => {
  try {
    const { sectionId, courseId, isTimeBound, timeAllowed } = req.body

    if (req.body.assessmentType === 'MCQ' && isTimeBound === 'true') {
      if (!timeAllowed || Number(timeAllowed) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Time allowed must be a positive number for time-bound assessments'
        })
      }
    }

    const course = await Course.findById(courseId)
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

    const content = parseAssessmentContent(req.body.content)
    let assessmentData = { ...req.body, content }

    if (req.body.assessmentType === 'MCQ') {
      delete assessmentData.assessor
      delete assessmentData.moderator
      delete assessmentData.verifier
    }

    if (req.body.assessmentType === 'MCQ' && content?.mcqs) {
      assessmentData.content.mcqs = await uploadMcqFiles(content.mcqs, req.files || [])
    }

    if (req.body.assessmentType === 'FILE') {
      assessmentData.content = await uploadFileAssessmentAssets(content, req.files || [])
    }

    const assessment = new Assessment({
      ...assessmentData,
      orderNumber: (course.totalAssessments || 0) + 1
    })

    const savedAssessment = await assessment.save()

    await Section.findByIdAndUpdate(sectionId, {
      $push: { assessments: savedAssessment._id }
    })

    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalAssessments: 1 }
    })

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessment: savedAssessment
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getAssessments = async (req, res) => {
  try {
    const { sectionId } = req.params
    const studentId = req.query.studentId

    const assessments = await Assessment.find({ sectionId })

    if (studentId) {
      const attempts = await AssessmentAttempt.find({
        assessmentId: { $in: assessments.map((assessment) => assessment._id) },
        studentId
      })

      const attemptsByAssessment = attempts.reduce((acc, attempt) => {
        acc[attempt.assessmentId.toString()] = attempt
        return acc
      }, {})

      const assessmentsWithAttempts = assessments.map((assessment) => {
        const assessmentObj = assessment.toObject()
        const attempt = attemptsByAssessment[assessment._id.toString()]
        return {
          ...assessmentObj,
          attempt: attempt || null
        }
      })

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
    handleError(res, error)
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
      content: rawContent
    } = req.body

    const existingAssessment = await Assessment.findById(id)
    if (!existingAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      })
    }

    const content = parseAssessmentContent(rawContent)
    let updatedContent = { ...content }

    if (assessmentType === 'MCQ' && content?.mcqs) {
      const mcqsWithFiles = await Promise.all(
        content.mcqs.map(async (mcq, index) => {
          const updatedMcq = { ...mcq }

          if (existingAssessment.content?.mcqs?.[index]) {
            const existingMcq = existingAssessment.content.mcqs[index]
            updatedMcq.imageFile = existingMcq.imageFile
            updatedMcq.audioFile = existingMcq.audioFile
          }

          const imageFile = req.files?.find((file) => file.fieldname === `mcqImage_${index}`)
          if (imageFile) {
            updatedMcq.imageFile = await uploadToS3(
              imageFile,
              'MCQ_IMAGES',
              `${Date.now()}-${imageFile.originalname}`
            )
          }

          const audioFile = req.files?.find((file) => file.fieldname === `mcqAudio_${index}`)
          if (audioFile) {
            updatedMcq.audioFile = await uploadToS3(
              audioFile,
              'MCQ_AUDIO',
              `${Date.now()}-${audioFile.originalname}`
            )
          }

          return updatedMcq
        })
      )
      updatedContent.mcqs = mcqsWithFiles
    }

    if (assessmentType === 'FILE') {
      updatedContent = {
        ...(existingAssessment.content
          ? JSON.parse(JSON.stringify(existingAssessment.content))
          : {}),
        ...updatedContent
      }

      updatedContent = await uploadFileAssessmentAssets(updatedContent, req.files || [])
    }

    const assessment = await Assessment.findByIdAndUpdate(
      id,
      {
        assessmentType,
        totalMarks,
        percentage,
        isTimeBound,
        timeAllowed,
        content: updatedContent,
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
    handleError(res, error)
  }
}
