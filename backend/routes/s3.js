import express from 'express'
import { getSignedUrl } from '../controllers/s3.js'

const router = express.Router()

// Get signed URL for file access
router.get('/url/:folder/:filename', getSignedUrl)

export default router