import express from 'express'
import multer from 'multer'
import { 
  createAssessment,
  getAssessments,
  updateAssessment,
  deleteAssessment
} from '../controllers/assessment.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// Create assessment with file upload support
router.post('/', upload.any(), createAssessment)

// Get assessments
router.get('/:sectionId', getAssessments)

// Update assessment with file upload support
router.put('/:id', upload.any(), updateAssessment)

// Delete assessment
router.delete('/:id', deleteAssessment)

export default router 