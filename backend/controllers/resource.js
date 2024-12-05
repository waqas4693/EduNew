import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'
import Section from '../models/section.js'

export const createResource = async (req, res) => {
  try {
    const { resources } = req.body
    
    const saveResource = async (resourceData) => {
      if (resourceData.resourceType === 'MCQ') {
        console.log('MCQ Data:', {
          numberOfCorrectAnswers: resourceData.content?.mcq?.numberOfCorrectAnswers,
          correctAnswers: resourceData.content?.mcq?.correctAnswers,
          correctAnswersLength: resourceData.content?.mcq?.correctAnswers?.length
        })
      }

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
            numberOfCorrectAnswers: parseInt(resourceData.content?.mcq?.numberOfCorrectAnswers) || 1,
            correctAnswers: resourceData.content?.mcq?.correctAnswers || [],
            imageUrl: resourceData.content?.mcq?.imageUrl || ''
          } : undefined
        }
      })

      if (resourceData.resourceType === 'MCQ') {
        console.log('Constructed Resource MCQ:', {
          numberOfCorrectAnswers: resource.content.mcq.numberOfCorrectAnswers,
          correctAnswers: resource.content.mcq.correctAnswers,
          correctAnswersLength: resource.content.mcq.correctAnswers.length
        })
      }

      const savedResource = await resource.save()
      
      await Section.findByIdAndUpdate(
        resourceData.sectionId,
        { $push: { resources: savedResource._id } }
      )
      
      return savedResource
    }

    if (!Array.isArray(resources)) {
      const savedResource = await saveResource(req.body)
      return res.status(201).json({ success: true, data: savedResource })
    }

    const savedResources = await Promise.all(resources.map(saveResource))
    res.status(201).json({ success: true, data: savedResources })

  } catch (error) {
    console.error('Resource Creation Error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
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