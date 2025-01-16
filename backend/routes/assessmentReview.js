import express from 'express'
import { 
  getAllSubmittedAssessments,
  gradeAssessment,
  getUnitProgress,
  getGradedAssessments,
  getStudentAssessments
} from '../controllers/assessmentReviewController.js'

const router = express.Router()

router.get('/submitted', getAllSubmittedAssessments)
router.get('/graded', getGradedAssessments)
router.patch('/grade/:attemptId', gradeAssessment)
router.get('/progress/:unitId/:studentId', getUnitProgress)
router.get('/student/:studentId', getStudentAssessments)

export default router