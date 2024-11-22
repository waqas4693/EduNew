import Section from '../models/section.js'
import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'

export const createSection = async (req, res) => {
  try {
    const { name, unitId } = req.body
    
    const section = new Section({
      name,
      unitId,
      resources: [],
      status: 1
    })
    
    const savedSection = await section.save()
    
    res.status(201).json({
      success: true,
      data: savedSection
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getUnitSections = async (req, res) => {
  try {
    const { unitId } = req.params
    const sections = await Section.find({ 
      unitId,
      status: 1 
    })

    res.status(200).json({
      sections
    })
  } catch (error) {
    handleError(res, error)
  }
} 