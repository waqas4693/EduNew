import Section from '../models/section.js'
import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'

export const createSection = async (req, res) => {
  try {
    const { sections } = req.body
    
    if (!Array.isArray(sections)) {
      const section = new Section({
        name: req.body.name,
        unitId: req.body.unitId,
        resources: [],
        status: 1
      })
      const savedSection = await section.save()
      return res.status(201).json({
        success: true,
        data: savedSection
      })
    }

    const savedSections = await Promise.all(
      sections.map(async sectionData => {
        const section = new Section({
          name: sectionData.name,
          unitId: sectionData.unitId,
          resources: [],
          status: 1
        })
        return section.save()
      })
    )
    
    res.status(201).json({
      success: true,
      data: savedSections
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