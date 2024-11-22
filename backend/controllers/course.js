import Course from '../models/course.js'
import { handleError } from '../utils/errorHandler.js'

export const createCourse = async (req, res) => {
  try {
    const { name } = req.body
    
    const course = new Course({
      name
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
    const courses = await Course.find({ status: 1 })
      .select('name units')
      .lean()
    
    const coursesWithCount = await Promise.all(courses.map(async course => ({
      id: course._id,
      name: course.name,
      units: course.units.length,
      image: `/background-images/${Math.floor(Math.random() * 5) + 1}.jpg`
    })))

    res.status(200).json({
      success: true,
      data: coursesWithCount
    })
  } catch (error) {
    handleError(res, error)
  }
} 