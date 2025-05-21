import Section from '../models/section.js'
import Resource from '../models/resource.js'
import SectionStats from '../models/sectionStats.js'

import { uploadToS3 } from './s3.js'
import { handleError } from '../utils/errorHandler.js'

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

    // Handle PDF audio file
    if (resourceType === 'PDF' && req.files.audioFile) {
      const audioFileName = await uploadToS3(
        req.files.audioFile[0],
        'AUDIO',
        `${Date.now()}-${req.files.audioFile[0].originalname}`
      )
      content.audioFile = audioFileName
      content.audioRepeatCount = content.audioRepeatCount || 1
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

    // Update SectionStats based on resource type
    const updateQuery = { $inc: { totalResources: 1 } }
    if (resourceType === 'MCQ') {
      updateQuery.$inc.totalMcqs = 1
    } else if (resourceType === 'ASSESSMENT') {
      updateQuery.$inc.totalAssessments = 1
    }

    await SectionStats.findOneAndUpdate(
      { sectionId },
      updateQuery
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
    }).sort('number')

    // Properly serialize each resource's content
    const serializedResources = resources.map(resource => {
      const serializedContent = {
        ...resource.content.toObject(),
        // Handle MCQ content
        mcq: resource.content.mcq ? {
          question: resource.content.mcq.question || '',
          options: resource.content.mcq.options || [],
          numberOfCorrectAnswers: resource.content.mcq.numberOfCorrectAnswers || 1,
          correctAnswers: resource.content.mcq.correctAnswers || [],
          imageFile: resource.content.mcq.imageFile || null,
          audioFile: resource.content.mcq.audioFile || null
        } : null,
        // Handle questions array
        questions: resource.content.questions ? resource.content.questions.map(q => ({
          question: q.question || '',
          answer: q.answer || ''
        })) : [],
        // Handle external links
        externalLinks: resource.content.externalLinks ? resource.content.externalLinks.map(link => ({
          name: link.name || '',
          url: link.url || ''
        })) : [],
        // Handle other content fields
        fileName: resource.content.fileName || '',
        backgroundImage: resource.content.backgroundImage || '',
        repeatCount: resource.content.repeatCount || 1
      }

      return {
        ...resource.toObject(),
        content: serializedContent
      }
    })
    
    res.status(200).json({
      success: true,
      data: serializedResources
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const getSectionResources = async (req, res) => {
  try {
    const { sectionId } = req.params
    const { page = 1, limit = 15, search = '' } = req.query
    
    const query = {
      sectionId,
      status: 1
    }

    // Add search filter if search term exists
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }

    const skip = (page - 1) * limit

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort('number')
        .skip(skip)
        .limit(limit)
        .select('name number resourceType content.fileName content.audioFile content.audioRepeatCount content.backgroundImage content.mcq'),
      Resource.countDocuments(query)
    ])

    res.status(200).json({
      resources,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + resources.length < total
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const updateResource = async (req, res) => {
  try {
    const { id } = req.params
    const { name, resourceType, content } = req.body

    // Parse the content string back into an object if it's a string
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content

    // Get the existing resource to check for file updates
    const existingResource = await Resource.findById(id)
    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      })
    }

    // Handle file uploads to S3 if new files are provided
    if (req.files) {
      // Handle main file update
      if (req.files.file) {
        const fileName = await uploadToS3(
          req.files.file[0],
          resourceType,  // Uses resource type as folder name
          `${Date.now()}-${req.files.file[0].originalname}`
        )
        parsedContent.fileName = fileName
      }

      // Handle thumbnail update
      if (req.files.thumbnail) {
        const thumbnailName = await uploadToS3(
          req.files.thumbnail[0],
          'THUMBNAILS',
          `${Date.now()}-${req.files.thumbnail[0].originalname}`
        )
        parsedContent.thumbnailUrl = thumbnailName
      }

      // Handle background image update
      if (req.files.backgroundImage) {
        const bgImageName = await uploadToS3(
          req.files.backgroundImage[0],
          'BACKGROUNDS',
          `${Date.now()}-${req.files.backgroundImage[0].originalname}`
        )
        parsedContent.backgroundImage = bgImageName
      }

      // Handle PDF audio file update
      if (resourceType === 'PDF' && req.files.audioFile) {
        const audioFileName = await uploadToS3(
          req.files.audioFile[0],
          'AUDIO',
          `${Date.now()}-${req.files.audioFile[0].originalname}`
        )
        parsedContent.audioFile = audioFileName
        parsedContent.audioRepeatCount = parsedContent.audioRepeatCount || 1
      }

      // Handle MCQ files update
      if (resourceType === 'MCQ') {
        if (req.files.mcqImage) {
          const mcqImageName = await uploadToS3(
            req.files.mcqImage[0],
            'MCQ_IMAGES',
            `${Date.now()}-${req.files.mcqImage[0].originalname}`
          )
          parsedContent.mcq.imageFile = mcqImageName
        }
        
        if (req.files.mcqAudio) {
          const mcqAudioName = await uploadToS3(
            req.files.mcqAudio[0],
            'MCQ_AUDIO',
            `${Date.now()}-${req.files.mcqAudio[0].originalname}`
          )
          parsedContent.mcq.audioFile = mcqAudioName
        }
      }
    }

    const resource = await Resource.findByIdAndUpdate(
      id,
      { 
        name,
        resourceType,
        content: parsedContent,
        updatedAt: Date.now()
      },
      { new: true }
    )

    res.status(200).json({
      success: true,
      data: resource
    })
  } catch (error) {
    console.error('Resource Update Error:', error)
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

export const updateResourceNumber = async (req, res) => {
  try {
    const { id } = req.params
    const { newNumber, sectionId } = req.body

    // Check for number conflicts
    const existingResource = await Resource.findOne({
      sectionId,
      number: newNumber,
      status: 1,
      _id: { $ne: id }
    })

    if (existingResource) {
      return res.status(400).json({
        success: false,
        message: `Resource number ${newNumber} already exists in this section`
      })
    }

    // Update resource number
    const resource = await Resource.findByIdAndUpdate(
      id,
      { number: newNumber },
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

export const insertResource = async (req, res) => {
  const session = await Resource.startSession();
  session.startTransaction();

  try {
    const { newResource } = req.body;
    
    // Validate inputs
    if (!newResource || !newResource.sectionId || !newResource.number || !newResource.name || !newResource.resourceType) {
      throw new Error('Missing required fields');
    }

    // First, check if a resource with the target number exists
    const existingResource = await Resource.findOne({
      sectionId: newResource.sectionId,
      number: newResource.number,
      status: 1
    }).session(session);
    

    if (existingResource) {      
      // First, find all resources that need to be updated
      const resourcesToUpdate = await Resource.find({
        sectionId: newResource.sectionId,
        number: { $gte: newResource.number },
        status: 1
      }).sort({ number: -1 }).session(session);
      
      // Update resources one by one in descending order to avoid conflicts
      for (const resource of resourcesToUpdate) {
        await Resource.findByIdAndUpdate(
          resource._id,
          { $inc: { number: 1 } },
          { session }
        );
      }
    }

    // Create the new resource
    const resource = new Resource({
      name: newResource.name,
      number: newResource.number,
      sectionId: newResource.sectionId,
      resourceType: newResource.resourceType,
      content: newResource.content || {}
    });
    
    try {
      await resource.save({ session });
    } catch (saveError) {
      console.error('Error saving new resource:', saveError);
      throw saveError;
    }

    // Update the section to include the new resource
    const sectionUpdate = await Section.findByIdAndUpdate(
      newResource.sectionId,
      { $push: { resources: resource._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Error in insertResource:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    await session.abortTransaction();
    session.endSession();
    
    if (error.code === 11000) {
      try {
        const nextNumber = await Resource.findOne({
          sectionId: newResource.sectionId,
          status: 1
        })
        .sort('-number')
        .select('number')
        .lean();

        const availableNumber = (nextNumber?.number || 0) + 1;

        // Create new resource with the next available number
        const resource = new Resource({
          ...newResource,
          number: availableNumber
        });
        await resource.save();

        return res.status(201).json({
          success: true,
          data: resource
        });
      } catch (retryError) {
        console.error('Error in retry attempt:', retryError);
        return res.status(400).json({
          success: false,
          message: 'Failed to insert resource. Please try again.'
        });
      }
    }
    handleError(res, error);
  }
};

export const searchResourcesByName = async (req, res) => {
  try {
    const { sectionId } = req.params
    const { name } = req.query

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      })
    }

    const resources = await Resource.find({
      sectionId,
      status: 1,
      name: { $regex: name, $options: 'i' }
    })
    .sort('number')
    .select('name number resourceType content.fileName')

    res.status(200).json({
      success: true,
      data: resources
    })
  } catch (error) {
    handleError(res, error)
  }
}

export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params
    const resource = await Resource.findById(id)
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      })
    }

    // Soft delete by updating status
    await Resource.findByIdAndUpdate(id, { status: 2 })
    
    // Update section to remove resource reference
    await Section.findByIdAndUpdate(
      resource.sectionId,
      { $pull: { resources: resource._id } }
    )

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    })
  } catch (error) {
    handleError(res, error)
  }
} 