import Unit from '../models/unit.js'
import Course from '../models/course.js'
import { handleError } from '../utils/errorHandler.js'

export const createUnit = async (req, res) => {
  try {
    const { name, courseId } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      })
    }

    const unit = new Unit({
      name,
      courseId
    })

    const savedUnit = await unit.save()
    
    course.units.push(savedUnit._id)
    await course.save()

    res.status(201).json({
      success: true,
      data: savedUnit
    })

  } catch (error) {
    handleError(res, error)
  }
} 