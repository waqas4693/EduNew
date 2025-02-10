import mongoose from 'mongoose'
import Resource from './models/resource.js'
import dotenv from 'dotenv'

dotenv.config()

const updateResources = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('Connected to MongoDB')

    // Find all resources that don't have a number field
    const resources = await Resource.find({ number: { $exists: false } })
    console.log(`Found ${resources.length} resources without number field`)

    // Update each resource
    for (const resource of resources) {
      await Resource.findByIdAndUpdate(
        resource._id,
        { $set: { number: 0 } },
        { new: true }
      )
    }

    console.log('Successfully updated all resources')
    process.exit(0)
  } catch (error) {
    console.error('Error updating resources:', error)
    process.exit(1)
  }
}

updateResources() 