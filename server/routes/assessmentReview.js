import express from 'express'
import multer from 'multer'
import {
  getAllSubmittedAssessments,
  updateAssessmentStatus,
  uploadFeedback,
  submitModeratorDecision,
  submitVerifierDecision,
  getGradedAssessments,
  getStudentAssessments,
  gradeAssessment
} from '../controllers/assessmentReviewController.js'
import { verifyToken, requireAssessmentRoles } from '../middleware/auth.js'

const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() })

router.use(verifyToken)
router.use(requireAssessmentRoles)

router.get('/submitted', getAllSubmittedAssessments)
router.get('/graded', getGradedAssessments)
router.get('/student/:studentId', getStudentAssessments)
router.patch('/status/:attemptId', updateAssessmentStatus)
router.patch('/grade/:attemptId', gradeAssessment)
router.post('/feedback/:attemptId', upload.single('feedbackFile'), uploadFeedback)
router.post('/moderate/:attemptId', submitModeratorDecision)
router.post('/verify/:attemptId', submitVerifierDecision)

export default router
