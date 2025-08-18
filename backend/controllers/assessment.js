import { handleError } from '../utils/errorHandler.js'
import Assessment from '../models/assessment.js'
import Section from '../models/section.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import Course from '../models/course.js'
import { uploadToS3 } from './s3.js'

export const createAssessment = async (req, res) => {
  try {
    const { sectionId, courseId, isTimeBound, timeAllowed } = req.body

    // Only validate time for MCQ assessments that are explicitly time-bound
    if (req.body.assessmentType === 'MCQ' && isTimeBound === 'true') {
      if (!timeAllowed || Number(timeAllowed) <= 0) {
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

    // Parse content if it's a JSON string (from FormData)
    const content = typeof req.body.content === 'string' ? JSON.parse(req.body.content) : req.body.content

    // Debug: Log what backend receives
    console.log('=== BACKEND ASSESSMENT DEBUG ===')
    console.log('req.body.assessmentType:', req.body.assessmentType)
    console.log('content.mcqs:', content?.mcqs?.length || 0, 'MCQs')
    console.log('req.files length:', req.files?.length || 0)
    if (req.files) {
      req.files.forEach(file => {
        console.log(`File: ${file.fieldname} - ${file.originalname} (${file.size} bytes)`)
      })
    }
    if (content?.mcqs) {
      content.mcqs.forEach((mcq, index) => {
        console.log(`MCQ ${index}:`, {
          hasImageFile: !!mcq.imageFile,
          hasAudioFile: !!mcq.audioFile,
          imageFileType: typeof mcq.imageFile,
          audioFileType: typeof mcq.audioFile
        })
      })
    }
    console.log('=== END BACKEND DEBUG ===')

    // Handle MCQ file uploads if assessment type is MCQ
    let assessmentData = { ...req.body, content }
    if (req.body.assessmentType === 'MCQ' && content && content.mcqs) {
      console.log('Processing MCQ files...')
      const mcqsWithFiles = await Promise.all(
        content.mcqs.map(async (mcq, index) => {
          console.log(`Processing MCQ ${index}...`)
          const updatedMcq = { ...mcq }
          
          // Handle MCQ image upload
          const imageFile = req.files?.find(file => file.fieldname === `mcqImage_${index}`)
          if (imageFile) {
            console.log(`Found image file for MCQ ${index}:`, imageFile.originalname)
            try {
              const imageFileName = await uploadToS3(
                imageFile,
                'MCQ_IMAGES',
                `${Date.now()}-${imageFile.originalname}`
              )
              updatedMcq.imageFile = imageFileName
              console.log(`Image uploaded successfully for MCQ ${index}:`, imageFileName)
            } catch (error) {
              console.error(`Error uploading image for MCQ ${index}:`, error)
            }
          } else {
            console.log(`No image file found for MCQ ${index}`)
          }
          
          // Handle MCQ audio upload
          const audioFile = req.files?.find(file => file.fieldname === `mcqAudio_${index}`)
          if (audioFile) {
            console.log(`Found audio file for MCQ ${index}:`, audioFile.originalname)
            try {
              const audioFileName = await uploadToS3(
                audioFile,
                'MCQ_AUDIO',
                `${Date.now()}-${audioFile.originalname}`
              )
              updatedMcq.audioFile = audioFileName
              console.log(`Audio uploaded successfully for MCQ ${index}:`, audioFileName)
            } catch (error) {
              console.error(`Error uploading audio for MCQ ${index}:`, error)
            }
          } else {
            console.log(`No audio file found for MCQ ${index}`)
          }
          
          console.log(`Final MCQ ${index} data:`, {
            hasImageFile: !!updatedMcq.imageFile,
            hasAudioFile: !!updatedMcq.audioFile,
            imageFile: updatedMcq.imageFile,
            audioFile: updatedMcq.audioFile
          })
          
          return updatedMcq
        })
      )
      assessmentData.content.mcqs = mcqsWithFiles
      console.log('All MCQ files processed. Final assessmentData.content.mcqs:', 
        assessmentData.content.mcqs.map((mcq, i) => ({
          index: i,
          imageFile: mcq.imageFile,
          audioFile: mcq.audioFile
        }))
      )
    }

    console.log('Creating assessment with data:', JSON.stringify({
      assessmentType: assessmentData.assessmentType,
      content: {
        mcqs: assessmentData.content?.mcqs?.map((mcq, i) => ({
          index: i,
          hasImageFile: !!mcq.imageFile,
          hasAudioFile: !!mcq.audioFile,
          imageFile: mcq.imageFile,
          audioFile: mcq.audioFile
        }))
      }
    }, null, 2))

    const assessment = new Assessment({
      ...assessmentData,
      orderNumber: course.totalAssessments
    })
    
    const savedAssessment = await assessment.save()
    
    console.log('Saved assessment to database:', JSON.stringify({
      _id: savedAssessment._id,
      content: {
        mcqs: savedAssessment.content?.mcqs?.map((mcq, i) => ({
          index: i,
          hasImageFile: !!mcq.imageFile,
          hasAudioFile: !!mcq.audioFile,
          imageFile: mcq.imageFile,
          audioFile: mcq.audioFile
        }))
      }
    }, null, 2))

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
    handleError(error, res)
  }
}

export const getAssessments = async (req, res) => {
  try {
    const { sectionId } = req.params
    const studentId = req.query.studentId


    // Get all assessments for the section
    const assessments = await Assessment.find({ sectionId })

    if (studentId) {
      // Get all attempts for these assessments by this student
      const attempts = await AssessmentAttempt.find({
        assessmentId: { $in: assessments.map(a => a._id) },
        studentId: studentId
      })

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

    // Get the existing assessment to preserve file references
    const existingAssessment = await Assessment.findById(id)
    if (!existingAssessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      })
    }

    let updatedContent = { ...content }

    // Handle MCQ file uploads if assessment type is MCQ
    if (assessmentType === 'MCQ' && content && content.mcqs) {
      const mcqsWithFiles = await Promise.all(
        content.mcqs.map(async (mcq, index) => {
          const updatedMcq = { ...mcq }
          
          // Preserve existing file references
          if (existingAssessment.content && existingAssessment.content.mcqs && existingAssessment.content.mcqs[index]) {
            const existingMcq = existingAssessment.content.mcqs[index]
            updatedMcq.imageFile = existingMcq.imageFile
            updatedMcq.audioFile = existingMcq.audioFile
          }
          
          // Handle new MCQ image upload
          if (req.files && req.files[`mcqImage_${index}`]) {
            const imageFileName = await uploadToS3(
              req.files[`mcqImage_${index}`][0],
              'MCQ_IMAGES',
              `${Date.now()}-${req.files[`mcqImage_${index}`][0].originalname}`
            )
            updatedMcq.imageFile = imageFileName
          }
          
          // Handle new MCQ audio upload
          if (req.files && req.files[`mcqAudio_${index}`]) {
            const audioFileName = await uploadToS3(
              req.files[`mcqAudio_${index}`][0],
              'MCQ_AUDIO',
              `${Date.now()}-${req.files[`mcqAudio_${index}`][0].originalname}`
            )
            updatedMcq.audioFile = audioFileName
          }
          
          return updatedMcq
        })
      )
      updatedContent.mcqs = mcqsWithFiles
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
    handleError(error, res)
  }
}
