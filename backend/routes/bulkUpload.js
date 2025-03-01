import express from 'express'
import multer from 'multer'
import { uploadResource } from '../controllers/bulkUpload.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Route for single resource upload
router.post('/upload', upload.single('file'), uploadResource)

export default router 