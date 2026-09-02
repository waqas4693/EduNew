import express from 'express'
import multer from 'multer'
import {
  createAssessment,
  getAssessments,
  updateAssessment,
  deleteAssessment
} from '../controllers/assessment.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

const MAX_FILE_SIZE = 100 * 1024 * 1024

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 30
  }
})

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum upload size is 100MB per file.'
      })
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        success: false,
        message: 'Too many files attached to this assessment upload.'
      })
    }

    return res.status(400).json({
      success: false,
      message: err.message
    })
  }

  return next(err)
}

router.use(verifyToken)

router.post('/', requireAdmin, upload.any(), handleMulterError, createAssessment)
router.get('/:sectionId', getAssessments)
router.put('/:id', requireAdmin, upload.any(), handleMulterError, updateAssessment)
router.delete('/:id', requireAdmin, deleteAssessment)

export default router
