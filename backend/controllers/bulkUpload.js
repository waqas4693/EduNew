import Resource from '../models/resource.js'
import Section from '../models/section.js'
import { uploadToS3 } from './s3.js'

export const uploadResource = async (req, res) => {
  try {
    const { section: sectionName, type } = req.body
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file provided' 
      })
    }

    // Get section ID from name
    const sectionDoc = await Section.findOne({ 
      name: sectionName,
      status: 1 
    })

    if (!sectionDoc) {
      return res.status(404).json({
        success: false,
        message: `Section not found: ${sectionName}`
      })
    }

    // Get latest resource number for this section
    const latestResource = await Resource.findOne({ 
      sectionId: sectionDoc._id,
      status: 1 
    })
    .sort('-number')
    .select('number')

    const currentNumber = (latestResource?.number || 0) + 1

    // Upload to S3
    const s3FileName = await uploadToS3(
      req.file,
      type, // Uses resource type as folder name
      `${Date.now()}-${req.file.originalname}`
    )

    // Create resource document
    const newResource = new Resource({
      name: req.file.originalname.split('.')[0], // Use filename without extension as resource name
      number: currentNumber,
      resourceType: type,
      sectionId: sectionDoc._id,
      content: {
        fileName: s3FileName
      }
    })

    await newResource.save()
    
    // Update section
    await Section.findByIdAndUpdate(
      sectionDoc._id,
      { $push: { resources: newResource._id } }
    )

    res.status(200).json({
      success: true,
      data: {
        resourceId: newResource._id,
        fileName: s3FileName
      }
    })

  } catch (error) {
    console.error('Resource upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading resource',
      error: error.message
    })
  }
}

// Helper function for mime types (keep this from original)
function getMimeType(resourceType) {
  const mimeMap = {
    'VIDEO': 'video/mp4',
    'IMAGE': 'image/jpeg',
    'AUDIO': 'audio/mpeg',
    'PDF': 'application/pdf',
    'PPT': 'application/vnd.ms-powerpoint'
  }
  return mimeMap[resourceType] || 'application/octet-stream'
} 