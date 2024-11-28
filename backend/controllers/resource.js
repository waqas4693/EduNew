import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'

export const createResource = async (req, res) => {
  try {
    const { resources } = req.body
    
    if (!Array.isArray(resources)) {
      // Handle single resource case
      const resource = new Resource({
        name: req.body.name,
        resourceType: req.body.resourceType,
        sectionId: req.body.sectionId,
        content: {
          text: req.body.content?.text || '',
          questions: req.body.content?.questions || [],
          backgroundImage: req.body.content?.backgroundImage || '',
          previewImage: req.body.content?.previewImage || '',
          thumbnailUrl: req.body.content?.thumbnailUrl || '',
          externalLink: req.body.content?.externalLink || ''
        }
      })
      const savedResource = await resource.save()
      return res.status(201).json({
        success: true,
        data: savedResource
      })
    }

    // Handle multiple resources
    const savedResources = await Promise.all(
      resources.map(async resourceData => {
        const resource = new Resource({
          name: resourceData.name,
          resourceType: resourceData.resourceType,
          sectionId: resourceData.sectionId,
          content: {
            text: resourceData.content?.text || '',
            questions: resourceData.content?.questions || [],
            backgroundImage: resourceData.content?.backgroundImage || '',
            previewImage: resourceData.content?.previewImage || '',
            thumbnailUrl: resourceData.content?.thumbnailUrl || '',
            externalLink: resourceData.content?.externalLink || ''
          }
        })
        return resource.save()
      })
    )
    
    res.status(201).json({
      success: true,
      data: savedResources
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