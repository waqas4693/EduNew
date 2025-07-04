import User from '../models/user.js'
import Student from '../models/student.js'
import PasswordReset from '../models/passwordReset.js'
import { generateVerificationToken, sendPasswordResetEmail, sendPasswordResetSuccessEmail } from '../utils/emailService.js'

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      })
    }

    // Check if user is active
    if (user.status === 2) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administration.'
      })
    }

    // Delete any existing unused reset tokens for this user
    await PasswordReset.deleteMany({
      userId: user._id,
      isUsed: false
    })

    // Generate reset token
    const resetToken = generateVerificationToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Create reset record
    await PasswordReset.create({
      userId: user._id,
      token: resetToken,
      expiresAt: expiresAt
    })

    // Get user name for email
    let userName = 'User'
    if (user.role === 2) {
      // For students, get name from Student model
      const student = await Student.findOne({ email })
      if (student) {
        userName = student.name
      }
    } else if (user.role === 1) {
      // For admin users, use name from User model
      userName = user.name || 'Administrator'
    }

    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, userName, resetToken)

    if (emailSent) {
      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      })
    }

  } catch (error) {
    console.error('Error requesting password reset:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      })
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      })
    }

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    // Find user
    const user = await User.findById(resetRecord.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if user is active
    if (user.status === 2) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administration.'
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // Mark token as used
    resetRecord.isUsed = true
    await resetRecord.save()

    // Get user name for success email
    let userName = 'User'
    if (user.role === 2) {
      const student = await Student.findOne({ email: user.email })
      if (student) {
        userName = student.name
      }
    } else if (user.role === 1) {
      userName = user.name || 'Administrator'
    }

    // Send success email
    await sendPasswordResetSuccessEmail(user.email, userName)

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

// Validate reset token (optional endpoint for frontend validation)
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      })
    }

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid'
    })

  } catch (error) {
    console.error('Error validating reset token:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
} 