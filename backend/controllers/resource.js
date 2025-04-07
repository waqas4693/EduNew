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
  console.log('Starting insertResource with request body:', JSON.stringify(req.body, null, 2));
  
  const session = await Resource.startSession();
  session.startTransaction();
  console.log('MongoDB session started');

  try {
    const { newResource } = req.body;
    console.log('Processing newResource:', JSON.stringify(newResource, null, 2));
    
    // Validate inputs
    if (!newResource || !newResource.sectionId || !newResource.number || !newResource.name || !newResource.resourceType) {
      console.log('Validation failed - missing required fields');
      throw new Error('Missing required fields');
    }

    // First, check if a resource with the target number exists
    const existingResource = await Resource.findOne({
      sectionId: newResource.sectionId,
      number: newResource.number,
      status: 1
    }).session(session);
    
    console.log('Existing resource check result:', existingResource ? 'Found' : 'Not found');

    if (existingResource) {
      console.log('Incrementing numbers for resources >=', newResource.number);
      
      // First, find all resources that need to be updated
      const resourcesToUpdate = await Resource.find({
        sectionId: newResource.sectionId,
        number: { $gte: newResource.number },
        status: 1
      }).sort({ number: -1 }).session(session);
      
      console.log('Found resources to update:', resourcesToUpdate.length);

      // Update resources one by one in descending order to avoid conflicts
      for (const resource of resourcesToUpdate) {
        console.log(`Updating resource ${resource._id} from number ${resource.number} to ${resource.number + 1}`);
        await Resource.findByIdAndUpdate(
          resource._id,
          { $inc: { number: 1 } },
          { session }
        );
      }
    }

    console.log('Creating new resource with data:', {
      name: newResource.name,
      number: newResource.number,
      sectionId: newResource.sectionId,
      resourceType: newResource.resourceType,
      content: newResource.content || {}
    });

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
      console.log('New resource saved successfully:', resource);
    } catch (saveError) {
      console.error('Error saving new resource:', saveError);
      throw saveError;
    }

    console.log('Updating section with new resource ID:', resource._id);
    // Update the section to include the new resource
    const sectionUpdate = await Section.findByIdAndUpdate(
      newResource.sectionId,
      { $push: { resources: resource._id } },
      { session }
    );
    console.log('Section update result:', sectionUpdate ? 'Success' : 'Failed');

    await session.commitTransaction();
    session.endSession();
    console.log('Transaction committed successfully');

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
    console.log('Transaction aborted and session ended');
    
    if (error.code === 11000) {
      console.log('Handling duplicate key error');
      try {
        console.log('Attempting to find next available number');
        const nextNumber = await Resource.findOne({
          sectionId: newResource.sectionId,
          status: 1
        })
        .sort('-number')
        .select('number')
        .lean();

        const availableNumber = (nextNumber?.number || 0) + 1;
        console.log('Next available number:', availableNumber);

        // Create new resource with the next available number
        const resource = new Resource({
          ...newResource,
          number: availableNumber
        });
        await resource.save();
        console.log('Resource saved with next available number:', resource);

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