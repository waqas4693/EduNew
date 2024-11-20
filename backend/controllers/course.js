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