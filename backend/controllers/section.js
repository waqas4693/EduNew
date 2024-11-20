import Section from '../models/section.js'
import Unit from '../models/unit.js'
import { handleError } from '../utils/errorHandler.js'

export const createSection = async (req, res) => {
  try {
    const { name, unitId } = req.body

    const unit = await Unit.findById(unitId)
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      })
    }

    const section = new Section({
      name,
      unitId
    })

    const savedSection = await section.save()
    
    unit.sections.push(savedSection._id)
    await unit.save()

    res.status(201).json({
      success: true,
      data: savedSection
    })

  } catch (error) {
    handleError(res, error)
  }
} 