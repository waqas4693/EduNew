import express from 'express'
import { loginUser, updatePassword, updateProfile, verifySession } from '../controllers/auth.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/', loginUser)
router.get('/verify', verifyToken, verifySession)
router.post('/update-password', verifyToken, updatePassword)
router.patch('/update-profile', verifyToken, updateProfile)

export default router
