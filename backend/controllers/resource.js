import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'

export const createResource = async (req, res) => {
  try {
    const { resources } = req.body
    
    const saveResource = async (resourceData) => {
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
          externalLink: resourceData.content?.externalLink || '',
          mcq: resourceData.resourceType === 'MCQ' ? {
            question: resourceData.content?.mcq?.question || '',
            options: resourceData.content?.mcq?.options || [],
            correctAnswer: resourceData.content?.mcq?.correctAnswer || '',
            imageUrl: resourceData.content?.mcq?.imageUrl || ''
          } : undefined
        }
      })
      return resource.save()
    }

    if (!Array.isArray(resources)) {
      const savedResource = await saveResource(req.body)
      return res.status(201).json({ success: true, data: savedResource })
    }

    const savedResources = await Promise.all(resources.map(saveResource))
    res.status(201).json({ success: true, data: savedResources })

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