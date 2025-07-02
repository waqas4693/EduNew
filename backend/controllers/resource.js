import Section from '../models/section.js'
import Resource from '../models/resource.js'
import SectionStats from '../models/sectionStats.js'

import { uploadToS3 } from './s3.js'
import { handleError } from '../utils/errorHandler.js'

export const createResource = async (req, res) => {
  console.log('=== Resource Creation Started ===')
  console.log('Request body:', { name: req.body.name, resourceType: req.body.resourceType, sectionId: req.body.sectionId, number: req.body.number })
  
  try {
    const { name, resourceType, sectionId, number } = req.body
    const content = JSON.parse(req.body.content)
    
    console.log('Parsed content type:', typeof content)
    console.log('Resource type:', resourceType)

    // Check if number already exists for this section
    console.log('Checking for existing resource with number:', number, 'in section:', sectionId)
    const existingResource = await Resource.findOne({
      sectionId,
      number,
      status: 1
    })

    if (existingResource) {
      console.log('Resource number conflict detected:', { number, sectionId })
      return res.status(400).json({
        success: false,
        message: `Resource number ${number} already exists in this section`
      })
    }

    console.log('No conflicts found, proceeding with file uploads...')

    // Handle file uploads to S3
    if (req.files.file) {
      console.log('Uploading main file to S3...')
      const fileName = await uploadToS3(
        req.files.file[0],
        resourceType,  // Uses resource type as folder name
        `${Date.now()}-${req.files.file[0].originalname}`
      )
      content.fileName = fileName
      console.log('Main file uploaded successfully:', fileName)
    }

    if (req.files.thumbnail) {
      console.log('Uploading thumbnail to S3...')
      const thumbnailName = await uploadToS3(
        req.files.thumbnail[0],
        'THUMBNAILS',
        `${Date.now()}-${req.files.thumbnail[0].originalname}`
      )
      content.thumbnailUrl = thumbnailName
      console.log('Thumbnail uploaded successfully:', thumbnailName)
    }

    if (req.files.backgroundImage) {
      console.log('Uploading background image to S3...')
      const bgImageName = await uploadToS3(
        req.files.backgroundImage[0],
        'BACKGROUNDS',
        `${Date.now()}-${req.files.backgroundImage[0].originalname}`
      )
      content.backgroundImage = bgImageName
      console.log('Background image uploaded successfully:', bgImageName)
    }

    // Handle PDF audio file
    if (resourceType === 'PDF' && req.files.audioFile) {
      console.log('Uploading PDF audio file to S3...')
      const audioFileName = await uploadToS3(
        req.files.audioFile[0],
        'AUDIO',
        `${Date.now()}-${req.files.audioFile[0].originalname}`
      )
      content.audioFile = audioFileName
      content.audioRepeatCount = content.audioRepeatCount || 1
      console.log('PDF audio file uploaded successfully:', audioFileName)
    }

    // Handle MCQ files
    if (resourceType === 'MCQ') {
      console.log('Processing MCQ-specific files...')
      if (req.files.mcqImage) {
        console.log('Uploading MCQ image to S3...')
        const mcqImageName = await uploadToS3(
          req.files.mcqImage[0],
          'MCQ_IMAGES',
          `${Date.now()}-${req.files.mcqImage[0].originalname}`
        )
        content.mcq.imageFile = mcqImageName
        console.log('MCQ image uploaded successfully:', mcqImageName)
      }
      
      if (req.files.mcqAudio) {
        console.log('Uploading MCQ audio to S3...')
        const mcqAudioName = await uploadToS3(
          req.files.mcqAudio[0],
          'MCQ_AUDIO',
          `${Date.now()}-${req.files.mcqAudio[0].originalname}`
        )
        content.mcq.audioFile = mcqAudioName
        console.log('MCQ audio uploaded successfully:', mcqAudioName)
      }
    }

    console.log('Creating new resource in database...')
    const resource = new Resource({
      name,
      number,
      resourceType,
      sectionId,
      content
    })

    const savedResource = await resource.save()
    console.log('Resource saved successfully with ID:', savedResource._id)
    
    console.log('Updating section with new resource reference...')
    await Section.findByIdAndUpdate(
      sectionId,
      { $push: { resources: savedResource._id } }
    )
    console.log('Section updated successfully')

    // Update SectionStats based on resource type
    console.log('Updating section statistics...')
    const updateQuery = { $inc: { totalResources: 1 } }
    if (resourceType === 'MCQ') {
      updateQuery.$inc.totalMcqs = 1
      console.log('Incrementing MCQ count in section stats')
    } else if (resourceType === 'ASSESSMENT') {
      updateQuery.$inc.totalAssessments = 1
      console.log('Incrementing assessment count in section stats')
    }

    await SectionStats.findOneAndUpdate(
      { sectionId },
      updateQuery
    )
    console.log('Section statistics updated successfully')

    console.log('=== Resource Creation Completed Successfully ===')
    res.status(201).json({ success: true, data: savedResource })
  } catch (error) {
    console.error('=== Resource Creation Error ===')
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    if (error.code === 11000) {
      console.log('Duplicate key error detected')
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
  console.log('=== Get Resources Started ===')
  console.log('Query parameters:', req.query)
  
  try {
    const { sectionId } = req.query
    console.log('Fetching resources for section:', sectionId)
    
    const resources = await Resource.find({ 
      sectionId,
      status: 1 
    }).sort('number')

    console.log('Found', resources.length, 'resources')

    // Properly serialize each resource's content
    console.log('Serializing resource content...')
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
    
    console.log('=== Get Resources Completed Successfully ===')
    res.status(200).json({
      success: true,
      data: serializedResources
    })
  } catch (error) {
    console.error('=== Get Resources Error ===')
    console.error('Error details:', error.message)
    handleError(res, error)
  }
}

export const getSectionResources = async (req, res) => {
  console.log('=== Get Section Resources Started ===')
  console.log('Request parameters:', req.params)
  console.log('Query parameters:', req.query)
  
  try {
    const { sectionId } = req.params
    const { page = 1, limit = 15, search = '' } = req.query
    
    console.log('Fetching resources for section:', sectionId, 'with pagination:', { page, limit, search })
    
    const query = {
      sectionId,
      status: 1
    }

    // Add search filter if search term exists
    if (search) {
      query.name = { $regex: search, $options: 'i' }
      console.log('Applying search filter:', search)
    }

    const skip = (page - 1) * limit
    console.log('Pagination details:', { skip, limit })

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort('number')
        .skip(skip)
        .limit(limit)
        .select('name number resourceType content.fileName content.audioFile content.audioRepeatCount content.backgroundImage content.mcq'),
      Resource.countDocuments(query)
    ])

    console.log('Query results:', { resourcesFound: resources.length, totalResources: total })

    console.log('=== Get Section Resources Completed Successfully ===')
    res.status(200).json({
      resources,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + resources.length < total
    })
  } catch (error) {
    console.error('=== Get Section Resources Error ===')
    console.error('Error details:', error.message)
    handleError(res, error)
  }
}

export const updateResource = async (req, res) => {
  console.log('=== Update Resource Started ===')
  console.log('Resource ID:', req.params.id)
  console.log('Request body:', { name: req.body.name, resourceType: req.body.resourceType })
  
  try {
    const { id } = req.params
    const { name, resourceType, content } = req.body

    // Parse the content string back into an object if it's a string
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content
    console.log('Content type:', typeof content, 'Parsed successfully:', !!parsedContent)

    // Get the existing resource to check for file updates
    console.log('Fetching existing resource...')
    const existingResource = await Resource.findById(id)
    if (!existingResource) {
      console.log('Resource not found with ID:', id)
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      })
    }
    console.log('Existing resource found:', { name: existingResource.name, type: existingResource.resourceType })

    // Preserve existing file references
    console.log('Preserving existing file references...')
    const existingContent = existingResource.content.toObject()
    parsedContent.fileName = existingContent.fileName
    parsedContent.backgroundImage = existingContent.backgroundImage
    parsedContent.audioFile = existingContent.audioFile
    if (parsedContent.mcq) {
      parsedContent.mcq.imageFile = existingContent.mcq?.imageFile
      parsedContent.mcq.audioFile = existingContent.mcq?.audioFile
    }

    // Handle file uploads to S3 if new files are provided
    if (req.files) {
      console.log('Processing new file uploads...')
      // Handle main file update
      if (req.files.file) {
        console.log('Uploading new main file to S3...')
        const fileName = await uploadToS3(
          req.files.file[0],
          resourceType,  // Uses resource type as folder name
          `${Date.now()}-${req.files.file[0].originalname}`
        )
        parsedContent.fileName = fileName
        console.log('New main file uploaded:', fileName)
      }

      // Handle thumbnail update
      if (req.files.thumbnail) {
        console.log('Uploading new thumbnail to S3...')
        const thumbnailName = await uploadToS3(
          req.files.thumbnail[0],
          'THUMBNAILS',
          `${Date.now()}-${req.files.thumbnail[0].originalname}`
        )
        parsedContent.thumbnailUrl = thumbnailName
        console.log('New thumbnail uploaded:', thumbnailName)
      }

      // Handle background image update
      if (req.files.backgroundImage) {
        console.log('Uploading new background image to S3...')
        const bgImageName = await uploadToS3(
          req.files.backgroundImage[0],
          'BACKGROUNDS',
          `${Date.now()}-${req.files.backgroundImage[0].originalname}`
        )
        parsedContent.backgroundImage = bgImageName
        console.log('New background image uploaded:', bgImageName)
      }

      // Handle PDF audio file update
      if (resourceType === 'PDF' && req.files.audioFile) {
        console.log('Uploading new PDF audio file to S3...')
        const audioFileName = await uploadToS3(
          req.files.audioFile[0],
          'AUDIO',
          `${Date.now()}-${req.files.audioFile[0].originalname}`
        )
        parsedContent.audioFile = audioFileName
        parsedContent.audioRepeatCount = parsedContent.audioRepeatCount || 1
        console.log('New PDF audio file uploaded:', audioFileName)
      }

      // Handle MCQ files update
      if (resourceType === 'MCQ') {
        console.log('Processing MCQ file updates...')
        if (req.files.mcqImage) {
          console.log('Uploading new MCQ image to S3...')
          const mcqImageName = await uploadToS3(
            req.files.mcqImage[0],
            'MCQ_IMAGES',
            `${Date.now()}-${req.files.mcqImage[0].originalname}`
          )
          parsedContent.mcq = parsedContent.mcq || {}
          parsedContent.mcq.imageFile = mcqImageName
          console.log('New MCQ image uploaded:', mcqImageName)
        }
        
        if (req.files.mcqAudio) {
          console.log('Uploading new MCQ audio to S3...')
          const mcqAudioName = await uploadToS3(
            req.files.mcqAudio[0],
            'MCQ_AUDIO',
            `${Date.now()}-${req.files.mcqAudio[0].originalname}`
          )
          parsedContent.mcq = parsedContent.mcq || {}
          parsedContent.mcq.audioFile = mcqAudioName
          console.log('New MCQ audio uploaded:', mcqAudioName)
        }
      }
    }

    // Validate required files based on resource type
    if (resourceType === 'MCQ') {
      console.log('Validating MCQ content...')
      if (!parsedContent.mcq) {
        console.log('MCQ validation failed: Missing MCQ content')
        return res.status(400).json({
          success: false,
          message: 'MCQ content is required'
        })
      }
      if (!parsedContent.mcq.question) {
        console.log('MCQ validation failed: Missing question')
        return res.status(400).json({
          success: false,
          message: 'MCQ question is required'
        })
      }
      if (!parsedContent.mcq.options || parsedContent.mcq.options.length < 2) {
        console.log('MCQ validation failed: Insufficient options')
        return res.status(400).json({
          success: false,
          message: 'MCQ must have at least 2 options'
        })
      }
      if (!parsedContent.mcq.correctAnswers || parsedContent.mcq.correctAnswers.length === 0) {
        console.log('MCQ validation failed: Missing correct answers')
        return res.status(400).json({
          success: false,
          message: 'MCQ must have at least one correct answer'
        })
      }
      console.log('MCQ validation passed')
    }

    console.log('Updating resource in database...')
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

    console.log('=== Update Resource Completed Successfully ===')
    res.status(200).json({
      success: true,
      data: resource
    })
  } catch (error) {
    console.error('=== Update Resource Error ===')
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    console.error('Resource Update Error:', error)
    handleError(res, error)
  }
}

export const getLatestResourceNumber = async (req, res) => {
  console.log('=== Get Latest Resource Number Started ===')
  console.log('Section ID:', req.params.sectionId)
  
  try {
    const { sectionId } = req.params

    console.log('Finding latest resource number for section:', sectionId)
    const latestResource = await Resource.findOne({ 
      sectionId,
      status: 1 
    })
    .sort('-number')
    .select('number')

    const nextNumber = (latestResource?.number || 0) + 1
    console.log('Latest resource number:', latestResource?.number, 'Next available number:', nextNumber)

    console.log('=== Get Latest Resource Number Completed Successfully ===')
    res.status(200).json({
      success: true,
      nextNumber
    })
  } catch (error) {
    console.error('=== Get Latest Resource Number Error ===')
    console.error('Error details:', error.message)
    handleError(res, error)
  }
}

export const updateResourceNumber = async (req, res) => {
  console.log('=== Update Resource Number Started ===')
  console.log('Resource ID:', req.params.id)
  console.log('Request body:', req.body)
  
  try {
    const { id } = req.params
    const { newNumber, sectionId } = req.body

    console.log('Checking for number conflicts...')
    // Check for number conflicts
    const existingResource = await Resource.findOne({
      sectionId,
      number: newNumber,
      status: 1,
      _id: { $ne: id }
    })

    if (existingResource) {
      console.log('Number conflict detected:', { newNumber, sectionId, existingResourceId: existingResource._id })
      return res.status(400).json({
        success: false,
        message: `Resource number ${newNumber} already exists in this section`
      })
    }

    console.log('No conflicts found, updating resource number...')
    // Update resource number
    const resource = await Resource.findByIdAndUpdate(
      id,
      { number: newNumber },
      { new: true }
    )

    if (!resource) {
      console.log('Resource not found with ID:', id)
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      })
    }

    console.log('Resource number updated successfully:', { oldNumber: resource.number, newNumber })
    console.log('=== Update Resource Number Completed Successfully ===')
    res.status(200).json({
      success: true,
      data: resource
    })
  } catch (error) {
    console.error('=== Update Resource Number Error ===')
    console.error('Error details:', error.message)
    handleError(res, error)
  }
}

export const insertResource = async (req, res) => {
  console.log('=== Insert Resource Started ===')
  console.log('Request body:', req.body)
  
  const session = await Resource.startSession();
  session.startTransaction();
  console.log('Database transaction started')

  try {
    const { newResource } = req.body;
    
    // Validate inputs
    console.log('Validating input parameters...')
    if (!newResource || !newResource.sectionId || !newResource.number || !newResource.name || !newResource.resourceType) {
      console.log('Validation failed: Missing required fields')
      throw new Error('Missing required fields');
    }
    console.log('Input validation passed')

    // First, check if a resource with the target number exists
    console.log('Checking for existing resource with number:', newResource.number)
    const existingResource = await Resource.findOne({
      sectionId: newResource.sectionId,
      number: newResource.number,
      status: 1
    }).session(session);
    

    if (existingResource) {
      console.log('Existing resource found, shifting resources...')
      // First, find all resources that need to be updated
      const resourcesToUpdate = await Resource.find({
        sectionId: newResource.sectionId,
        number: { $gte: newResource.number },
        status: 1
      }).sort({ number: -1 }).session(session);
      
      console.log('Found', resourcesToUpdate.length, 'resources to shift')
      
      // Update resources one by one in descending order to avoid conflicts
      for (const resource of resourcesToUpdate) {
        console.log('Shifting resource:', { id: resource._id, oldNumber: resource.number, newNumber: resource.number + 1 })
        await Resource.findByIdAndUpdate(
          resource._id,
          { $inc: { number: 1 } },
          { session }
        );
      }
      console.log('All resources shifted successfully')
    }

    // Create the new resource
    console.log('Creating new resource...')
    const resource = new Resource({
      name: newResource.name,
      number: newResource.number,
      sectionId: newResource.sectionId,
      resourceType: newResource.resourceType,
      content: newResource.content || {}
    });
    
    try {
      await resource.save({ session });
      console.log('New resource saved successfully with ID:', resource._id)
    } catch (saveError) {
      console.error('Error saving new resource:', saveError);
      throw saveError;
    }

    // Update the section to include the new resource
    console.log('Updating section with new resource reference...')
    const sectionUpdate = await Section.findByIdAndUpdate(
      newResource.sectionId,
      { $push: { resources: resource._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    console.log('Database transaction committed successfully')

    console.log('=== Insert Resource Completed Successfully ===')
    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('=== Insert Resource Error ===')
    console.error('Error details:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    await session.abortTransaction();
    session.endSession();
    console.log('Database transaction aborted')
    
    if (error.code === 11000) {
      console.log('Duplicate key error detected, attempting retry with next available number...')
      try {
        const nextNumber = await Resource.findOne({
          sectionId: newResource.sectionId,
          status: 1
        })
        .sort('-number')
        .select('number')
        .lean();

        const availableNumber = (nextNumber?.number || 0) + 1;
        console.log('Next available number:', availableNumber)

        // Create new resource with the next available number
        const resource = new Resource({
          ...newResource,
          number: availableNumber
        });
        await resource.save();
        console.log('Resource created with next available number:', availableNumber)

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
  console.log('=== Search Resources By Name Started ===')
  console.log('Section ID:', req.params.sectionId)
  console.log('Search query:', req.query.name)
  
  try {
    const { sectionId } = req.params
    const { name } = req.query

    if (!name) {
      console.log('Search validation failed: Missing search term')
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      })
    }

    console.log('Searching resources with name pattern:', name)
    const resources = await Resource.find({
      sectionId,
      status: 1,
      name: { $regex: name, $options: 'i' }
    })
    .sort('number')
    .select('name number resourceType content.fileName')

    console.log('Search completed, found', resources.length, 'matching resources')
    console.log('=== Search Resources By Name Completed Successfully ===')
    res.status(200).json({
      success: true,
      data: resources
    })
  } catch (error) {
    console.error('=== Search Resources By Name Error ===')
    console.error('Error details:', error.message)
    handleError(res, error)
  }
}

export const deleteResource = async (req, res) => {
  console.log('=== Delete Resource Started ===')
  console.log('Resource ID:', req.params.id)
  
  try {
    const { id } = req.params
    console.log('Fetching resource for deletion...')
    const resource = await Resource.findById(id)
    
    if (!resource) {
      console.log('Resource not found with ID:', id)
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      })
    }

    console.log('Resource found:', { name: resource.name, type: resource.resourceType, sectionId: resource.sectionId })

    // Soft delete by updating status
    console.log('Performing soft delete (updating status to 2)...')
    await Resource.findByIdAndUpdate(id, { status: 2 })
    console.log('Resource status updated to deleted')
    
    // Update section to remove resource reference
    console.log('Removing resource reference from section...')
    await Section.findByIdAndUpdate(
      resource.sectionId,
      { $pull: { resources: resource._id } }
    )
    console.log('Resource reference removed from section')

    console.log('=== Delete Resource Completed Successfully ===')
    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    })
  } catch (error) {
    console.error('=== Delete Resource Error ===')
    console.error('Error details:', error.message)
    handleError(res, error)
  }
} 