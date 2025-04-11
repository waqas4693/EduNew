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
      role: user.role,
      isDemo: user.isDemo || false
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
          isDemo: student.isDemo || false,
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

export const updateProfile = async (req, res) => {
  try {
    const { name, email, contactNo, address } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Update user record
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic user info
    user.name = name;
    if (email !== user.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
      user.email = email;
    }
    
    await user.save();

    // If user is a student, update student record as well
    if (userRole === 2 && req.user.studentId) {
      const student = await Student.findById(req.user.studentId);
      if (student) {
        student.name = name;
        student.email = email;
        student.contactNo = contactNo;
        student.address = address;
        await student.save();
      }
    }

    // Generate updated user data
    let userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    if (userRole === 2 && req.user.studentId) {
      userData = {
        ...userData,
        studentId: req.user.studentId,
        contactNo,
        address
      };
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 