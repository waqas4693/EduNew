import User from '../models/user.js'
import Student from '../models/student.js'
import bcrypt from 'bcryptjs'

export const newStudent = async (req, res) => {
  try {
    const { name, email, password, contactNo, address, courseId } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const user = new User({
      email,
      password: password,
      role: 2
    })
    await user.save()

    const student = new Student({
      name,
      email,
      contactNo,
      address,
      courses: [{
        courseId: courseId,
        courseStatus: 1,
        enrollmentDate: new Date()
      }]
    })
    await student.save()

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        name: student.name,
        email: student.email,
        contactNo: student.contactNo,
        address: student.address,
        status: student.status,
        courses: student.courses
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getDashboardData = async (req, res) => {
  try {
    const studentId = req.params.id

    const student = await Student.findById(studentId)
      .populate('courses.courseId')
      .lean()

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    const activeCourses = student.courses
      .filter(course => course.courseStatus === 1)
      .map(course => ({
        _id: course.courseId._id,
        name: course.courseId.name,
        progress: calculateProgress(course) // You'll need to implement this
      }))

    // You might want to implement a separate model for activities
    const recentActivities = [] // Implement based on your requirements

    res.status(200).json({
      success: true,
      data: {
        totalCourses: student.courses.length,
        activeCourses,
        recentActivities
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}