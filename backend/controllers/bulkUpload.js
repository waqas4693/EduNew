import { handleError } from '../utils/errorHandler.js'
import Resource from '../models/resource.js'
import Section from '../models/section.js'
import mongoose from 'mongoose'
import { uploadToS3 } from './s3.js'

export const bulkUploadResources = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Parse the resources data
    const resources = JSON.parse(req.body.resources)
    const files = req.files?.files || []

    // Validate section exists
    const section = await Section.findById(resources[0]?.sectionId)
    if (!section) {
      throw new Error('Section not found')
    }

    // Get the latest resource number for this section
    const latestResource = await Resource.findOne({ 
      sectionId: resources[0].sectionId,
      status: 1 
    })
    .sort('-number')
    .select('number')

    const startingNumber = (latestResource?.number || 0) + 1

    // Assign sequential numbers to new resources
    const numberedResources = resources.map((resource, index) => ({
      ...resource,
      number: startingNumber + index
    }))

    // Create a map of filenames to actual files for easy lookup
    const fileMap = files.reduce((acc, file) => {
      acc[file.originalname] = file
      return acc
    }, {})

    // Process each resource
    const savedResources = []
    for (const resource of numberedResources) {
      let content = resource.content

      // If this is a file-based resource (VIDEO, PDF, etc.)
      if (content.fileName) {
        const file = fileMap[content.fileName]
        if (!file) {
          throw new Error(`File ${content.fileName} not found in uploaded files`)
        }

        // Upload to S3
        const s3FileName = await uploadToS3(
          file,
          resource.resourceType,
          `${Date.now()}-${file.originalname}`
        )
        content.fileName = s3FileName
      }

      // Validate resource before saving
      validateResource(resource)

      // Create the resource
      const newResource = new Resource({
        name: resource.name,
        number: resource.number,
        resourceType: resource.resourceType,
        sectionId: resource.sectionId,
        content: content
      })

      const savedResource = await newResource.save({ session })
      savedResources.push(savedResource)

      // Update section with new resource
      await Section.findByIdAndUpdate(
        resource.sectionId,
        { $push: { resources: savedResource._id } },
        { session }
      )
    }

    // Commit the transaction
    await session.commitTransaction()

    res.status(200).json({
      success: true,
      message: 'Bulk upload completed successfully',
      data: {
        totalResources: savedResources.length,
        resources: savedResources,
        startingNumber: startingNumber,
        endingNumber: startingNumber + savedResources.length - 1
      }
    })

  } catch (error) {
    // Rollback the transaction on error
    await session.abortTransaction()

    console.error('Bulk Upload Error:', error)
    handleError(res, error)
  } finally {
    session.endSession()
  }
}

// Helper function to validate MCQ structure with better error messages
const validateMCQ = (mcq, resourceName = '') => {
  const prefix = resourceName ? `[${resourceName}] ` : ''

  if (!mcq.question) {
    throw new Error(`${prefix}MCQ question is required`)
  }

  if (!Array.isArray(mcq.options) || mcq.options.length < 2) {
    throw new Error(`${prefix}MCQ must have at least 2 options`)
  }

  if (!Array.isArray(mcq.correctAnswers) || mcq.correctAnswers.length === 0) {
    throw new Error(`${prefix}MCQ must have at least 1 correct answer`)
  }

  if (mcq.correctAnswers.length !== mcq.numberOfCorrectAnswers) {
    throw new Error(
      `${prefix}Number of correct answers (${mcq.correctAnswers.length}) does not match specified count (${mcq.numberOfCorrectAnswers})`
    )
  }

  // Create a map of options for case-insensitive comparison
  const optionsMap = mcq.options.reduce((acc, opt) => {
    acc[opt.toLowerCase()] = opt
    return acc
  }, {})

  // Verify all correct answers exist in options (case-insensitive)
  const invalidAnswers = mcq.correctAnswers.filter(
    answer => !optionsMap[answer.toLowerCase()]
  )

  if (invalidAnswers.length > 0) {
    throw new Error(
      `${prefix}Correct answer(s) "${invalidAnswers.join(', ')}" not found in options. Available options are: ${mcq.options.join(', ')}`
    )
  }

  // Normalize correct answers to match option cases
  mcq.correctAnswers = mcq.correctAnswers.map(
    answer => optionsMap[answer.toLowerCase()]
  )
}

// Helper function to validate resource data
const validateResource = (resource) => {
  if (!resource.name) {
    throw new Error('Resource name is required')
  }
  if (!resource.number) {
    throw new Error('Resource number is required')
  }
  if (!resource.sectionId) {
    throw new Error('Section ID is required')
  }
  if (!resource.resourceType) {
    throw new Error('Resource type is required')
  }
  if (resource.resourceType === 'MCQ') {
    validateMCQ(resource.content.mcq, resource.name)
  }
} 