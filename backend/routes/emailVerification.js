import express from 'express'
import { verifyEmail, resendVerificationEmail, getUnverifiedStudents } from '../controllers/emailVerification.js'

const router = express.Router()

// Verify email with token
router.get('/verify/:token', verifyEmail)

// Resend verification email
router.post('/resend/:studentId', resendVerificationEmail)

// Get unverified students (for admin)
router.get('/unverified', getUnverifiedStudents)

export default router 