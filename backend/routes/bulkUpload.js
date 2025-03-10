import express from 'express'
import multer from 'multer'
import { bulkUploadResources } from '../controllers/bulkUpload.js'

const router = express.Router()

// Configure multer for handling multiple file types
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 50 // Max 50 files
  }
})

// Define the fields we expect
const uploadFields = upload.fields([
  { name: 'files', maxCount: 50 }, // For video/pdf files
])

router.post('/mcq', uploadFields, bulkUploadResources)

export default router 