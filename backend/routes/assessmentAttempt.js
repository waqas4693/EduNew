import express from 'express'
import { 
  submitAttempt,
  getAttemptByStudent
} from '../controllers/assessmentAttemptController.js'
// import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/', submitAttempt)
router.get('/:assessmentId', getAttemptByStudent)

export default router 