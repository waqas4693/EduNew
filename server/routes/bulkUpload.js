import express from 'express'
import multer from 'multer'
import { bulkUploadResources } from '../controllers/bulkUpload.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 20000 * 1024 * 1024,
    files: 100
  }
})

const uploadFields = upload.fields([
  { name: 'files', maxCount: 100 }
])

router.use(verifyToken)

router.post('/mcq', requireAdmin, uploadFields, bulkUploadResources)

export default router
