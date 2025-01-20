import express from 'express'
import { loginUser, updatePassword } from '../controllers/auth.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/', loginUser)
router.post('/update-password', verifyToken, updatePassword)

export default router 