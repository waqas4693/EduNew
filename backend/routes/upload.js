import express from 'express'
import multer from 'multer'
import { uploadThumbnail, uploadFile } from '../controllers/upload.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/thumbnail', upload.single('thumbnail'), uploadThumbnail)
router.post('/file', upload.single('file'), uploadFile)

export default router 