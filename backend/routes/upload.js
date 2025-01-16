import express from 'express'
import multer from 'multer'
import { uploadThumbnail } from '../controllers/upload.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/thumbnail', upload.single('thumbnail'), uploadThumbnail)

export default router 