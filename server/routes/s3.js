import express from 'express'
import { getSignedUrl } from '../controllers/s3.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.get('/url/:folder/:filename', getSignedUrl)

export default router
