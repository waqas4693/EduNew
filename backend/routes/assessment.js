import express from 'express'
import { 
  createAssessment,
  getAssessments,
  updateAssessment,
  deleteAssessment
} from '../controllers/assessment.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/', createAssessment)
router.get('/:sectionId', getAssessments)
router.put('/:id', updateAssessment)
router.delete('/:id', deleteAssessment)

export default router 