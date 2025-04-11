import User from '../models/user.js'
import Student from '../models/student.js'
import Course from '../models/course.js'
import Unit from '../models/unit.js'
import Section from '../models/section.js'
import Resource from '../models/resource.js'
import ResourceView from '../models/resourceView.js'

export const newStudent = async (req, res) => {
  try {
    const { name, email, password, contactNo, address, courseId, isDemo } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const user = new User({
      email,
      password: password,
      role: 2,
      status: 1,
      isDemo: isDemo || false
    })
    await user.save()

    const student = new Student({
      name,
      email,
      contactNo,
      address,
      status: 1,
      isDemo: isDemo || false,
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
        isDemo: student.isDemo,
        courses: student.courses
      }
    })
  } catch (error) {
    console.error('Error creating student:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
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

export const getAllStudents = async (req, res) => {
  try {
    const { courseId } = req.params
    const { status } = req.query
    
    let query = { status: status ? parseInt(status) : 1 }

    if (courseId) {
      query['courses.courseId'] = courseId
      query['courses.courseStatus'] = 1
    }

    const students = await Student.find(query)
      .select('name email contactNo status courses')
      .populate({
        path: 'courses.courseId',
        select: 'name status',
        match: { status: 1 } // Only populate active courses
      })
      .lean()

    // Transform the data to include course information
    const transformedStudents = students.map(student => ({
      _id: student._id,
      name: student.name,
      email: student.email,
      contactNo: student.contactNo,
      status: student.status,
      courses: student.courses
        .filter(course => course.courseId) // Filter out any null populated courses
        .map(course => ({
          courseId: course.courseId._id,
          name: course.courseId.name,
          courseStatus: course.courseStatus,
          enrollmentDate: course.enrollmentDate
        }))
    }))

    res.status(200).json({
      success: true,
      data: {
        students: transformedStudents
      }
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // First find the student to get their email
    const student = await Student.findById(id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Update student status
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )

    // Update corresponding user status
    await User.findOneAndUpdate(
      { email: student.email },
      { status }
    )

    res.status(200).json(updatedStudent)
  } catch (error) {
    console.error('Error updating status:', error)
    res.status(500).json({ 
      message: 'Error updating status',
      error: error.message 
    })
  }
}

export const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.params.id

    // First get the student and populate course details
    const student = await Student.findById(studentId)
      .populate({
        path: 'courses.courseId',
        select: 'name thumbnail status' // Only select needed fields
      })
      .lean()

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    // Transform the courses data
    const courses = student.courses.map(course => ({
      _id: course.courseId._id,
      name: course.courseId.name,
      thumbnail: course.courseId.thumbnail,
      courseStatus: course.courseId.status,
      enrollmentDate: course.enrollmentDate
    }))

    res.status(200).json({
      success: true,
      data: {
        studentName: student.name,
        courses
      }
    })

  } catch (error) {
    console.error('Error fetching student courses:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const assignCourse = async (req, res) => {
  try {
    const { id } = req.params
    const { courseId } = req.body

    const student = await Student.findById(id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Check if course is already assigned
    const courseExists = student.courses.some(
      course => course.courseId.toString() === courseId
    )

    if (courseExists) {
      return res.status(400).json({ 
        message: 'Course is already assigned to this student' 
      })
    }

    // Add new course
    student.courses.push({
      courseId,
      courseStatus: 1,
      enrollmentDate: new Date()
    })

    await student.save()

    res.status(200).json({
      message: 'Course assigned successfully',
      student
    })

  } catch (error) {
    console.error('Error assigning course:', error)
    res.status(500).json({ 
      message: 'Error assigning course',
      error: error.message 
    })
  }
}

export const removeCourse = async (req, res) => {
  try {
    const { id, courseId } = req.params

    const student = await Student.findById(id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Remove the course from the student's courses array
    student.courses = student.courses.filter(
      course => course.courseId.toString() !== courseId
    )

    await student.save()

    res.status(200).json({
      message: 'Course removed successfully',
      student
    })

  } catch (error) {
    console.error('Error removing course:', error)
    res.status(500).json({ 
      message: 'Error removing course',
      error: error.message 
    })
  }
}

export const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params

    // First get the course name
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      })
    }

    // Find all students who have this course
    const students = await Student.find({
      'courses.courseId': courseId
    }).select('name email contactNo status')

    res.status(200).json({
      success: true,
      data: {
        courseName: course.name,
        students
      }
    })

  } catch (error) {
    console.error('Error fetching course students:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const getUnitProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.params

    // Get all units for the course
    const units = await Unit.find({ courseId, status: 1 }).lean()

    // Calculate progress for each unit
    const unitsProgress = await Promise.all(units.map(async unit => {
      // Get all sections for this unit
      const sections = await Section.find({ unitId: unit._id, status: 1 }).lean()
      
      // Get all resources from these sections
      const sectionIds = sections.map(section => section._id)
      const resources = await Resource.find({ 
        sectionId: { $in: sectionIds }, 
        status: 1 
      }).lean()
      
      // Get viewed resources count from ResourceView collection
      const viewedResourcesCount = await ResourceView.countDocuments({
        studentId,
        courseId,
        unitId: unit._id,
        resourceId: { $in: resources.map(r => r._id) }
      })

      const totalResources = resources.length
      const progress = totalResources > 0 
        ? Math.round((viewedResourcesCount / totalResources) * 100) 
        : 0

      return {
        _id: unit._id,
        name: unit.name,
        totalResources,
        viewedResources: viewedResourcesCount,
        progress
      }
    }))

    res.status(200).json({
      success: true,
      data: unitsProgress
    })

  } catch (error) {
    console.error('Error fetching unit progress:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params

    const student = await Student.findById(id)
      .populate({
        path: 'courses.courseId',
        select: 'name thumbnail status'
      })
      .lean()

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      })
    }

    res.status(200).json({
      success: true,
      data: student
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}

export const getDashboardStats = async (req, res) => {
  try {
    // Get total courses count
    const totalCourses = await Course.countDocuments()
    
    // Get total students count
    const totalStudents = await Student.countDocuments()
    
    // Get active courses count (status = 1)
    const activeCourses = await Course.countDocuments({ status: 1 })
    
    // Get active students count (status = 1)
    const activeStudents = await Student.countDocuments({ status: 1 })

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        activeCourses,
        activeStudents
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
}