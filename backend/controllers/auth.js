import User from '../models/user.js'
import Student from '../models/student.js'
import jwt from 'jsonwebtoken'

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.status === 2) {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently inactive. Please contact administration.'
      })
    }

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

    // Only fetch student data if user is a student
    if (user.role === 2) {
      const student = await Student.findOne({ email })
      
      if (student) {
        userData = {
          ...userData,
          studentId: student._id,
          name: student.name,
          contactNo: student.contactNo,
          address: student.address,
          courseIds: student.courses
            .filter(course => course.courseStatus === 1)
            .map(course => ({
              courseId: course.courseId,
              enrollmentDate: course.enrollmentDate
            }))
        }
      }
    } else if (user.role === 1) {
      // For admin users, add name from user model
      userData = {
        ...userData,
        name: user.name || 'Administrator' // Fallback name if not set
      }
    }

    const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '24h' })

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

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 