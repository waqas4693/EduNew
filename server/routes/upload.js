import express from 'express'
import multer from 'multer'
import { uploadThumbnail, uploadFile } from '../controllers/upload.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

const MAX_FILE_SIZE = 100 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  }
})

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum upload size is 100MB.'
      })
    }

    return res.status(400).json({
      success: false,
      message: err.message
    })
  }

  return next(err)
}

router.post('/thumbnail', verifyToken, upload.single('thumbnail'), handleMulterError, uploadThumbnail)
router.post('/file', verifyToken, upload.single('file'), handleMulterError, uploadFile)

export default router
