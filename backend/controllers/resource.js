import Resource from '../models/resource.js'
import Section from '../models/section.js'
import { handleError } from '../utils/errorHandler.js'

export const createResource = async (req, res) => {
  try {
    const { name, sectionId } = req.body

    const section = await Section.findById(sectionId)
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Section not found'
      })
    }

    const resource = new Resource({
      name,
      sectionId
    })

    const savedResource = await resource.save()
    
    section.resources.push(savedResource._id)
    await section.save()

    res.status(201).json({
      success: true,
      data: savedResource
    })

  } catch (error) {
    handleError(res, error)
  }
} 