import express from 'express'
import { 
  createAssessment,
  getAssessments,
  updateAssessment,
  deleteAssessment
} from '../controllers/assessment.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/', verifyToken, createAssessment)
router.get('/:sectionId', verifyToken, getAssessments)
router.put('/:id', verifyToken, updateAssessment)
router.delete('/:id', verifyToken, deleteAssessment)

export default router 