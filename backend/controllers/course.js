import Course from '../models/course.js'
import { handleError } from '../utils/errorHandler.js'

export const createCourse = async (req, res) => {
  try {
    const { name, thumbnail } = req.body
    
    const course = new Course({
      name,
      thumbnail
    })

    const savedCourse = await course.save()
    
    res.status(201).json({
      success: true,
      data: savedCourse
    })

  } catch (error) {
    handleError(res, error)
  }
}

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 1 })
    res.status(200).json({
      success: true,
      data: courses
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getEnrolledCourses = async (req, res) => {
  try {
    const { courseIds } = req.query
    
    if (!courseIds) {
      return res.status(400).json({
        success: false,
        message: 'Course IDs are required'
      })
    }

    const courseIdArray = courseIds.split(',')
    
    const courses = await Course.find({ 
      _id: { $in: courseIdArray },
      status: 1 
    })
    .select('name thumbnail units assessmentInterval')
    .lean()
    
    const coursesWithDetails = courses.map(course => ({
      id: course._id,
      name: course.name,
      image: course.thumbnail,
      units: course.units?.length || 0,
      assessmentInterval: course.assessmentInterval
    }))

    res.status(200).json({
      success: true,
      data: coursesWithDetails
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params
    const course = await Course.findOne({ 
      _id: id,
      status: 1 
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      })
    }

    res.status(200).json({
      success: true,
      data: course
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params
    const { name, thumbnail, assessmentInterval } = req.body

    const updateData = {}
    if (name) updateData.name = name
    if (thumbnail) updateData.thumbnail = thumbnail
    if (assessmentInterval !== undefined) updateData.assessmentInterval = assessmentInterval
    updateData.updatedAt = Date.now()

    const course = await Course.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      })
    }

    res.status(200).json({
      success: true,
      data: course
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const course = await Course.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      })
    }

    res.status(200).json({
      success: true,
      data: course
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getInactiveCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 2 })
    res.status(200).json({
      success: true,
      data: courses
    })
  } catch (error) {
    handleError(res, error)
  }
} 