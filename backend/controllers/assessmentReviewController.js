import AssessmentAttempt from '../models/AssessmentAttempt.js'
import Assessment from '../models/assessment.js'
import Unit from '../models/unit.js'

export const getAllSubmittedAssessments = async (req, res) => {
  try {
    const submittedAssessments = await AssessmentAttempt.find({
      status: 'SUBMITTED'
    })
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
    .populate('studentId', 'name email')
    .sort({ submittedAt: -1 })

    const assessmentsWithCalculatedMarks = submittedAssessments.map(attempt => {
      let totalMarks = 0
      let obtainedMarks = 0

      if (attempt.assessmentId.assessmentType === 'MCQ') {
        const mcqs = attempt.assessmentId.content.mcqs
        const mcqAnswers = attempt.content.mcqAnswers || []
        
        mcqs.forEach((mcq, index) => {
          totalMarks += 100 / mcqs.length
          if (mcqAnswers[index]?.selectedOption === mcq.correctAnswer) {
            obtainedMarks += 100 / mcqs.length
          }
        })
      }

      return {
        ...attempt._doc,
        calculatedMarks: Math.round(obtainedMarks),
        totalPossibleMarks: attempt.assessmentId.totalMarks,
        percentage: Math.round((obtainedMarks / 100) * 100)
      }
    })

    res.status(200).json({
      success: true,
      data: assessmentsWithCalculatedMarks
    })
  } catch (error) {
    console.error('Error fetching submitted assessments:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching submitted assessments'
    })
  }
}

export const gradeAssessment = async (req, res) => {
  try {
    const { attemptId } = req.params
    const { obtainedMarks } = req.body

    const attempt = await AssessmentAttempt.findById(attemptId)
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Assessment attempt not found'
      })
    }

    attempt.obtainedMarks = obtainedMarks
    attempt.status = 'GRADED'
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