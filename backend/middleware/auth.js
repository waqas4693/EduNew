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

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Verify both student and user still exist and are active
    const [student, user] = await Promise.all([
      Student.findById(decoded.id),
      User.findById(decoded.userId)
    ])

    if (!student || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (student.status === 2 || user.status === 2) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      })
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