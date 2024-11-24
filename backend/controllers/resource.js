import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'

export const createResource = async (req, res) => {
  try {
    const { name, resourceType, content, sectionId } = req.body
    
    const resource = new Resource({
      name,
      resourceType,
      sectionId,
      content: {
        text: content?.text || '',
        questions: content?.questions || [],
        backgroundImage: content?.backgroundImage || '',
        previewImage: content?.previewImage || '',
        thumbnailUrl: content?.thumbnailUrl || '',
        externalLink: content?.externalLink || ''
      }
    })

    const savedResource = await resource.save()
    
    res.status(201).json({
      success: true,
      data: savedResource
    })

  } catch (error) {
    handleError(res, error)
  }
}

export const getResources = async (req, res) => {
  try {
    const { sectionId } = req.query
    const resources = await Resource.find({ 
      sectionId,
      status: 1 
    })
    res.status(200).json({
      success: true,
      data: resources
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getSectionResources = async (req, res) => {
  try {
    const { sectionId } = req.params
    const resources = await Resource.find({
      sectionId,
      status: 1
    })

    res.status(200).json({
      resources
    })
  } catch (error) {
    handleError(res, error)
  }
} 