import express from 'express'
import multer from 'multer'
import { bulkUploadResources } from '../controllers/bulkUpload.js'

const router = express.Router()

// Configure multer for handling multiple file types
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: {
    fileSize: 20000 * 1024 * 1024, // 20GB limit
    files: 100 // Max 100 files
  }
})

// Define the fields we expect
const uploadFields = upload.fields([
  { name: 'files', maxCount: 100 }, // For video/pdf files
])

router.post('/mcq', uploadFields, bulkUploadResources)

export default router 