import AssessmentAttempt from '../models/AssessmentAttempt.js'
import Assessment from '../models/assessment.js'
import Unit from '../models/unit.js'
import Student from '../models/student.js'
import { uploadFile as uploadFileUtil } from '../utils/fileUpload.js'

const ROLE_STATUS_MAP = {
  3: ['SUBMITTED', 'PLAGIARISM_CHECK', 'MARKING', 'MARKING_REVISION'], // Assessor
  4: ['MARKED', 'MODERATION_REVISION'], // Moderator
  5: ['VERIFICATION'] // Verifier
}

export const getAllSubmittedAssessments = async (req, res) => {
  try {
    const role = parseInt(req.query.role)
    let query = {}
    if (role !== 1) {
      const allowedStatuses = ROLE_STATUS_MAP[role] || []
      query.status = { $in: allowedStatuses }
    }
    const submittedAssessments = await AssessmentAttempt.find(query)
      .populate({
        path: 'assessmentId',
        select: 'assessmentType totalMarks content assessor moderator verifier',
        populate: [
          { path: 'assessor', select: 'name email' },
          { path: 'moderator', select: 'name email' },
          { path: 'verifier', select: 'name email' },
          { path: 'sectionId', populate: { path: 'unitId', populate: 'courseId' } }
        ]
      })
      .populate('studentId', 'name email')
      .populate('statusHistory.changedBy', 'name email')
      .sort({ submittedAt: -1 })

    const assessmentsWithDetails = await Promise.all(submittedAssessments.map(async attempt => {
      const studentDetails = await Student.findOne({ email: attempt.studentId?.email })
      let calculatedData = {}
      if (attempt.assessmentId.assessmentType === 'MCQ') {
        calculatedData = calculateMCQMarks(attempt)
      }
      return {
        ...attempt._doc,
        ...calculatedData,
        studentName: studentDetails?.name || 'N/A',
        assessorName: attempt.assessmentId.assessor?.name || 'N/A',
        moderatorName: attempt.assessmentId.moderator?.name || 'N/A',
        verifierName: attempt.assessmentId.verifier?.name || 'N/A'
      }
    }))

    res.status(200).json({
      success: true,
      data: assessmentsWithDetails
    })
  } catch (error) {
    console.error('Error fetching assessments:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching assessments'
    })
  }
}

export const updateAssessmentStatus = async (req, res) => {
  try {
    const { attemptId } = req.params
    const { status, comments, userId } = req.body
    
    const attempt = await AssessmentAttempt.findById(attemptId)
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Assessment attempt not found'
      })
    }

    // If changing to MARKED status, validate requirements
    if (status === 'MARKED' && (!attempt.obtainedMarks || !attempt.feedbackFile)) {
      return res.status(400).json({
        success: false,
        message: 'Assessment must be graded and have feedback before marking'
      })
    }

    // Add to status history
    attempt.statusHistory.push({
      status,
      changedBy: userId,
      comments,
      timestamp: new Date()
    })

    attempt.status = status
    await attempt.save()

    res.status(200).json({
      success: true,
      message: 'Assessment status updated successfully',
      data: attempt
    })
  } catch (error) {
    console.error('Error updating assessment status:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating assessment status'
    })
  }
}

export const uploadFeedback = async (req, res) => {
  try {
    const { attemptId } = req.params
    const { userId } = req.body
    
    const attempt = await AssessmentAttempt.findById(attemptId)
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Assessment attempt not found'
      })
    }

    // Check if assessment has been graded
    if (!attempt.obtainedMarks) {
      return res.status(400).json({
        success: false,
        message: 'Assessment must be graded before uploading feedback'
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const fileName = await uploadFileUtil(
      req.file,
      'ASSESSMENT_FEEDBACK',
      req.file.originalname
    )
    
    attempt.feedbackFile = fileName

    // Add to status history
    attempt.statusHistory.push({
      status: attempt.status,
      changedBy: userId,
      comments: 'Feedback file uploaded',
      timestamp: new Date()
    })

    await attempt.save()

    res.status(200).json({
      success: true,
      message: 'Feedback uploaded successfully',
      data: attempt
    })
  } catch (error) {
    console.error('Error uploading feedback:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading feedback'
    })
  }
}

export const submitModeratorDecision = async (req, res) => {
  try {
    const { attemptId } = req.params
    const { status, comments } = req.body

    const attempt = await AssessmentAttempt.findById(attemptId)
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Assessment attempt not found'
      })
    }

    attempt.moderatorDecision = {
      status,
      comments,
      decidedAt: new Date()
    }

    attempt.status = status === 'SATISFIED' ? 'VERIFICATION' : 'MARKING_REVISION'
    await attempt.save()

    res.status(200).json({
      success: true,
      message: 'Moderation decision submitted successfully',
      data: attempt
    })
  } catch (error) {
    console.error('Error submitting moderation decision:', error)
    res.status(500).json({
      success: false,
      message: 'Error submitting moderation decision'
    })
  }
}

export const submitVerifierDecision = async (req, res) => {
  try {
    const { attemptId } = req.params
    const { status, comments } = req.body

    const attempt = await AssessmentAttempt.findById(attemptId)
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Assessment attempt not found'
      })
    }

    attempt.verifierDecision = {
      status,
      comments,
      decidedAt: new Date()
    }

    attempt.status = status === 'SATISFIED' ? 'GRADED' : 'MODERATION_REVISION'
    await attempt.save()

    res.status(200).json({
      success: true,
      message: 'Verification decision submitted successfully',
      data: attempt
    })
  } catch (error) {
    console.error('Error submitting verification decision:', error)
    res.status(500).json({
      success: false,
      message: 'Error submitting verification decision'
    })
  }
}

// Helper function for MCQ calculation
const calculateMCQMarks = (attempt) => {
  let totalMarks = 0
  let obtainedMarks = 0

  const mcqs = attempt.assessmentId.content.mcqs
  const mcqAnswers = attempt.content.mcqAnswers || []
  
  mcqs.forEach((mcq, index) => {
    totalMarks += 100 / mcqs.length
    if (mcqAnswers[index]?.selectedOption === mcq.correctAnswer) {
      obtainedMarks += 100 / mcqs.length
    }
  })

  return {
    calculatedMarks: Math.round(obtainedMarks),
    totalPossibleMarks: attempt.assessmentId.totalMarks,
    percentage: Math.round((obtainedMarks / 100) * 100)
  }
}

export const gradeAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params
    const { obtainedMarks, userId } = req.body

    const attempt = await AssessmentAttempt.findById(attemptId)
      .populate('assessmentId', 'totalMarks')
    
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Assessment attempt not found'
      })
    }

    // Validate marks against total marks
    if (obtainedMarks < 0 || obtainedMarks > attempt.assessmentId.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks must be between 0 and ${attempt.assessmentId.totalMarks}`
      })
    }

    attempt.obtainedMarks = obtainedMarks
    
    // Add to status history
    attempt.statusHistory.push({
      status: attempt.status, // Keep current status
      changedBy: userId,
      comments: `Assessment graded with ${obtainedMarks} marks`,
      timestamp: new Date()
    })

    await attempt.save()

    res.status(200).json({
      success: true,
      message: 'Assessment graded successfully',
      data: attempt
    })
  } catch (error) {
    console.error('Error grading assessment:', error)
    res.status(500).json({
      success: false,
      message: 'Error grading assessment'
    })
  }
}

export const getUnitProgress = async (req, res) => {
  try {
    const { unitId, studentId } = req.params

    // Get all sections in the unit with their assessments
    const unit = await Unit.findById(unitId).populate({
      path: 'sections',
      populate: {
        path: 'assessments'
      }
    })

    let totalPossibleMarks = 0
    let totalObtainedMarks = 0
    let totalAssessments = 0
    let completedAssessments = 0

    // Get all assessment IDs from all sections
    const assessmentIds = unit.sections.flatMap(section => 
      section.assessments.map(assessment => assessment._id)
    )

    // Get all graded attempts for this student
    const gradedAttempts = await AssessmentAttempt.find({
      assessmentId: { $in: assessmentIds },
      studentId: studentId,
      status: 'GRADED'
    }).populate('assessmentId')

    // Calculate total possible marks and obtained marks
    for (const section of unit.sections) {
      for (const assessment of section.assessments) {
        totalPossibleMarks += 100 // Assuming each assessment is out of 100
        totalAssessments++

        // Find matching graded attempt
        const attempt = gradedAttempts.find(
          attempt => attempt.assessmentId._id.toString() === assessment._id.toString()
        )

        if (attempt) {
          totalObtainedMarks += attempt.obtainedMarks
          completedAssessments++
        }
      }
    }

    // Calculate percentages
    const performancePercentage = totalPossibleMarks > 0 
      ? Math.round((totalObtainedMarks / totalPossibleMarks) * 100)
      : 0

    const completionPercentage = totalAssessments > 0
      ? Math.round((completedAssessments / totalAssessments) * 100)
      : 0

    res.status(200).json({
      success: true,
      data: {
        performancePercentage,
        completionPercentage,
        totalAssessments,
        completedAssessments,
        totalObtainedMarks,
        totalPossibleMarks,
        unitName: unit.name
      }
    })

  } catch (error) {
    console.error('Error calculating unit progress:', error)
    res.status(500).json({
      success: false,
      message: 'Error calculating unit progress',
      error: error.message
    })
  }
}

export const getGradedAssessments = async (req, res) => {
  try {
    const gradedAssessments = await AssessmentAttempt.find({
      status: 'GRADED'
    })
    .populate('assessmentId', 'assessmentType totalMarks content')
    .populate({
      path: 'assessmentId',
      populate: {
        path: 'sectionId',
        populate: {
          path: 'unitId',
          populate: 'courseId'
        }
      }
    })
    .populate('studentId', 'email')
    .sort({ updatedAt: -1 })

    const assessmentsWithDetails = await Promise.all(gradedAssessments.map(async attempt => {
      const studentDetails = await Student.findOne({ email: attempt.studentId?.email })
      
      return {
        ...attempt._doc,
        studentName: studentDetails?.name || 'N/A'
      }
    }))

    res.status(200).json({
      success: true,
      data: assessmentsWithDetails
    })
  } catch (error) {
    console.error('Error fetching graded assessments:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching graded assessments'
    })
  }
}

export const getStudentAssessments = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    const assessments = await AssessmentAttempt.find({
      studentId: studentId
    })
    .populate('assessmentId', 'assessmentType totalMarks content')
    .populate({
      path: 'assessmentId',
      populate: {
        path: 'sectionId',
        populate: {
          path: 'unitId',
          populate: 'courseId'
        }
      }
    })
    .sort({ submittedAt: -1 });

    const assessmentsWithCalculatedMarks = await Promise.all(assessments.map(async attempt => {
      let calculatedMarks = 0;
      
      if (attempt.assessmentId.assessmentType === 'MCQ') {
        const mcqs = attempt.assessmentId.content.mcqs;
        const mcqAnswers = attempt.content.mcqAnswers || [];
        
        mcqs.forEach((mcq, index) => {
          if (mcqAnswers[index]?.selectedOption === mcq.correctAnswer) {
            calculatedMarks += 100 / mcqs.length;
          }
        });
      }

      return {
        ...attempt._doc,
        calculatedMarks: Math.round(calculatedMarks),
        totalPossibleMarks: attempt.assessmentId.totalMarks,
        percentage: attempt.status === 'GRADED' 
          ? Math.round((attempt.obtainedMarks / attempt.assessmentId.totalMarks) * 100)
          : Math.round(calculatedMarks)
      };
    }));

    res.status(200).json({
      success: true,
      data: assessmentsWithCalculatedMarks
    });
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student assessments'
    });
  }
}; 