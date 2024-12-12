import Section from '../models/section.js'
import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'
import Unit from '../models/unit.js'

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
      
      // Update unit with the new section ID
      await Unit.findByIdAndUpdate(
        req.body.unitId,
        { $push: { sections: savedSection._id } }
      )

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
        const savedSection = await section.save()
        
        // Update unit with each new section ID
        await Unit.findByIdAndUpdate(
          sectionData.unitId,
          { $push: { sections: savedSection._id } }
        )
        
        return savedSection
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

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const section = await Section.findByIdAndUpdate(
      id,
      { 
        name,
        updatedAt: Date.now()
      },
      { new: true }
    )

    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      })
    }

    res.status(200).json({
      success: true,
      data: section
    })
  } catch (error) {
    handleError(res, error)
  }
} 