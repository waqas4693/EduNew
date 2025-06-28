import express from 'express'
import { verifyEmail, resendVerificationEmail, getUnverifiedStudents, testSMTP } from '../controllers/emailVerification.js'

const router = express.Router()

// Test SMTP connection
router.get('/test-smtp', testSMTP)

// Verify email with token
router.get('/verify/:token', verifyEmail)

// Resend verification email
router.post('/resend/:studentId', resendVerificationEmail)

// Get unverified students (for admin)
router.get('/unverified', getUnverifiedStudents)

export default router 