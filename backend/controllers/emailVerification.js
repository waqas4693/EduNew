import EmailVerification from '../models/emailVerification.js'
import User from '../models/user.js'
import Student from '../models/student.js'
import { generateVerificationToken, sendVerificationEmail, sendVerificationSuccessEmail, sendResendVerificationEmail, testSMTPConnection } from '../utils/emailService.js'

// Verify email with token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params

    // Find the verification record
    const verification = await EmailVerification.findOne({ 
      token, 
      isVerified: false,
      expiresAt: { $gt: new Date() }
    })

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      })
    }

    // Update user email verification status
    await User.findByIdAndUpdate(verification.userId, {
      emailVerified: true
    })

    // Mark verification as completed
    verification.isVerified = true
    await verification.save()

    // Get student details for success email
    const student = await Student.findById(verification.studentId)
    if (student) {
      // Send success email
      await sendVerificationSuccessEmail(student.email, student.name)
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    })

  } catch (error) {
    console.error('Error verifying email:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { studentId } = req.params

    // Find the student
    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Find the user
    const user = await User.findOne({ email: student.email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      })
    }

    // Delete any existing unverified tokens for this user
    await EmailVerification.deleteMany({
      userId: user._id,
      isVerified: false
    })

    // Create new verification token
    const verificationToken = generateVerificationToken()
    const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now

    await EmailVerification.create({
      userId: user._id,
      studentId: student._id,
      token: verificationToken,
      expiresAt: expiresAt
    })

    // Send new verification email
    const emailSent = await sendResendVerificationEmail(
      student.email, 
      student.name, 
      verificationToken, 
      req.body.password || 'Your password'
    )

    if (emailSent) {
      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      })
    }

  } catch (error) {
    console.error('Error resending verification email:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Get unverified students
export const getUnverifiedStudents = async (req, res) => {
  try {
    const unverifiedStudents = await User.aggregate([
      {
        $match: {
          role: 2, // Students
          emailVerified: false
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'email',
          foreignField: 'email',
          as: 'studentInfo'
        }
      },
      {
        $unwind: '$studentInfo'
      },
      {
        $project: {
          _id: '$studentInfo._id',
          name: '$studentInfo.name',
          email: '$email',
          contactNo: '$studentInfo.contactNo',
          status: '$studentInfo.status',
          isDemo: '$studentInfo.isDemo',
          createdAt: '$studentInfo.createdAt'
        }
      }
    ])

    res.status(200).json({
      success: true,
      data: unverifiedStudents
    })

  } catch (error) {
    console.error('Error fetching unverified students:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Test SMTP connection
export const testSMTP = async (req, res) => {
  try {
    const isConnected = await testSMTPConnection()
    
    if (isConnected) {
      res.json({ 
        success: true, 
        message: 'SMTP connection working!',
        config: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          user: process.env.SMTP_USER,
          frontendUrl: process.env.FRONTEND_URL || 'https://edusupplements.co.uk'
        }
      })
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'SMTP connection failed' 
      })
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Test failed', 
      error: error.message 
    })
  }
} 