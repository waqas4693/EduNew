import jwt from 'jsonwebtoken'
import Student from '../models/student.js'
import User from '../models/user.js'

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      })
    }

    console.log('Token:', token)

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    console.log('Decoded:', decoded)
    
    // Find user first as it's required for both roles
    const user = await User.findById(decoded.id)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.status === 2) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      })
    }

    // Only verify student record if user is a student
    if (user.role === 2) {
      const student = await Student.findById(decoded.studentId)
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        })
      }

      if (student.status === 2) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive'
        })
      }
    }

    req.user = decoded
    next()
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }
} 