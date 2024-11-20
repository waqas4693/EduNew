import User from '../models/user.js'
import Student from '../models/student.js'
import jwt from 'jsonwebtoken'

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user first
    const user = await User.findOne({ email })
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
        message: 'Your account is currently inactive. Please contact administration.'
      })
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    let userData = {
      id: user._id,
      email: user.email,
      role: user.role
    }

    // If user is a student, get additional student info
    if (user.role === 2) {
      const student = await Student.findOne({ email })
      if (student) {
        userData = {
          ...userData,
          studentId: student._id,
          name: student.name,
          contactNo: student.contactNo,
          address: student.address
        }
      }
    }

    const token = jwt.sign(
      userData,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(200).json({
      success: true,
      data: {
        token,
        user: userData
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
} 