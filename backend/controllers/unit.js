import Unit from '../models/unit.js'
import { handleError } from '../utils/errorHandler.js'
import Course from '../models/course.js'

export const createUnit = async (req, res) => {
  try {
    const { units } = req.body
    
    if (!Array.isArray(units)) {
      const unit = new Unit({ 
        name: req.body.name, 
        courseId: req.body.courseId 
      })
      const savedUnit = await unit.save()
      
      // Update course with the new unit ID
      await Course.findByIdAndUpdate(
        req.body.courseId,
        { $push: { units: savedUnit._id } }
      )

      return res.status(201).json({
        success: true,
        data: savedUnit
      })
    }

    const savedUnits = await Promise.all(
      units.map(async unitData => {
        const unit = new Unit({
          name: unitData.name,
          courseId: unitData.courseId
        })
        const savedUnit = await unit.save()
        
        // Update course with each new unit ID
        await Course.findByIdAndUpdate(
          unitData.courseId,
          { $push: { units: savedUnit._id } }
        )
        
        return savedUnit
      })
    )
    
    res.status(201).json({
      success: true,
      data: savedUnits
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