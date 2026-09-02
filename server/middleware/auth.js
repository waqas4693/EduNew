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
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token'

    res.status(401).json({
      success: false,
      message
    })
  }
}

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions'
    })
  }

  next()
}

export const requireAdmin = requireRoles(1)

export const requireAssessmentRoles = requireRoles(1, 3, 4, 5)
