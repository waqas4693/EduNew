import Unit from '../models/unit.js'
import { handleError } from '../utils/errorHandler.js'

export const createUnit = async (req, res) => {
  try {
    const { name, courseId } = req.body
    const unit = new Unit({ name, courseId })
    const savedUnit = await unit.save()
    res.status(201).json({
      success: true,
      data: savedUnit
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getCourseUnits = async (req, res) => {
  try {
    const { courseId } = req.params

    const units = await Unit.find({ 
      courseId,
      status: 1 
    })

    res.status(200).json({
      units
    })
  } catch (error) {
    handleError(res, error)
  }
} 