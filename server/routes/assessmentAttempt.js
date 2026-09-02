import express from 'express'
import {
  submitAttempt,
  getAttemptByStudent
} from '../controllers/assessmentAttemptController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.post('/', submitAttempt)
router.get('/:assessmentId', getAttemptByStudent)

export default router
