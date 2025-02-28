import Resource from '../models/resource.js'
import { handleError } from '../utils/errorHandler.js'
import Section from '../models/section.js'
import ResourceView from '../models/resourceView.js'
import { uploadToS3 } from './s3.js'

export const createResource = async (req, res) => {
  try {
    const { name, resourceType, sectionId, number } = req.body
    const content = JSON.parse(req.body.content)

    // Check if number already exists for this section
    const existingResource = await Resource.findOne({
      sectionId,
      number,
      status: 1
    })

    if (existingResource) {
      return res.status(400).json({
        success: false,
        message: `Resource number ${number} already exists in this section`
      })
    }

    // Handle file uploads to S3
    if (req.files.file) {
      const fileName = await uploadToS3(
        req.files.file[0],
        resourceType,  // Uses resource type as folder name
        `${Date.now()}-${req.files.file[0].originalname}`
      )
      content.fileName = fileName
    }

    if (req.files.thumbnail) {
      const thumbnailName = await uploadToS3(
        req.files.thumbnail[0],
        'THUMBNAILS',
        `${Date.now()}-${req.files.thumbnail[0].originalname}`
      )
      content.thumbnailUrl = thumbnailName
    }

    if (req.files.backgroundImage) {
      const bgImageName = await uploadToS3(
        req.files.backgroundImage[0],
        'BACKGROUNDS',
        `${Date.now()}-${req.files.backgroundImage[0].originalname}`
      )
      content.backgroundImage = bgImageName
    }

    // Handle MCQ files
    if (resourceType === 'MCQ') {
      if (req.files.mcqImage) {
        const mcqImageName = await uploadToS3(
          req.files.mcqImage[0],
          'MCQ_IMAGES',
          `${Date.now()}-${req.files.mcqImage[0].originalname}`
        )
        content.mcq.imageFile = mcqImageName
      }
      
      if (req.files.mcqAudio) {
        const mcqAudioName = await uploadToS3(
          req.files.mcqAudio[0],
          'MCQ_AUDIO',
          `${Date.now()}-${req.files.mcqAudio[0].originalname}`
        )
        content.mcq.audioFile = mcqAudioName
      }
    }

    const resource = new Resource({
      name,
      number,
      resourceType,
      sectionId,
      content
    })

    const savedResource = await resource.save()
    
    await Section.findByIdAndUpdate(
      sectionId,
      { $push: { resources: savedResource._id } }
    )

    res.status(201).json({ success: true, data: savedResource })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate resource number found'
      })
    }
    console.error('Resource Creation Error:', error)
    handleError(res, error)
  }
}

export const getResources = async (req, res) => {
  try {
    const { sectionId } = req.query
    const resources = await Resource.find({ 
      sectionId,
      status: 1 
    }).sort('number') // Sort by number
    
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
    }).sort('number') // Sort by number field

    res.status(200).json({
      resources
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateResource = async (req, res) => {
  try {
    const { id } = req.params
    const { name, resourceType, content } = req.body

    const resource = await Resource.findByIdAndUpdate(
      id,
      { 
        name,
        resourceType,
        content,
        updatedAt: Date.now()
      },
      { new: true }
    )

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      })
    }

    res.status(200).json({
      success: true,
      data: resource
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getResourcesWithViewStatus = async (req, res) => {
  try {
    const { sectionId, studentId } = req.params

    // Get all resources for the section, sorted by number
    const resources = await Resource.find({ 
      sectionId,
      status: 1 
    }).sort('number')

    // Get all resource views for this student with viewedAt field
    const resourceViews = await ResourceView.find({
      studentId,
      resourceId: { $in: resources.map(r => r._id) }
    }).select('resourceId viewedAt').lean()

    // Create a map for quick lookup of viewedAt dates
    const viewsMap = resourceViews.reduce((acc, view) => {
      acc[view.resourceId.toString()] = view.viewedAt
      return acc
    }, {})

    // Map resources with their view status and viewedAt date
    const resourcesWithStatus = resources.map(resource => ({
      _id: resource._id,
      name: resource.name,
      number: resource.number, // Include number in response
      resourceType: resource.resourceType,
      isViewed: resourceViews.some(view => 
        view.resourceId.toString() === resource._id.toString()
      ),
      viewedAt: viewsMap[resource._id.toString()] 
        ? new Date(viewsMap[resource._id.toString()]).toLocaleString() 
        : null
    }))

    res.status(200).json({
      success: true,
      data: resourcesWithStatus
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getLatestResourceNumber = async (req, res) => {
  try {
    const { sectionId } = req.params

    const latestResource = await Resource.findOne({ 
      sectionId,
      status: 1 
    })
    .sort('-number')
    .select('number')

    res.status(200).json({
      success: true,
      nextNumber: (latestResource?.number || 0) + 1
    })
  } catch (error) {
    handleError(res, error)
  }
} 