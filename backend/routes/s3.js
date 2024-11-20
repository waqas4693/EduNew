import express from 'express'
import {
  getS3SignedUrl,
  getS3SignedUrlGet
} from '../controllers/s3.js'

const router = express.Router();

router.post('/', getS3SignedUrl)
router.post('/get', getS3SignedUrlGet)
export default router