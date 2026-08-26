import AWS from 'aws-sdk'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Resource from '../models/resource.js'

dotenv.config()

// Check required environment variables
const requiredEnvVars = [
  'MONGO_URL',
  'AWS_ACCESS_KEY_ID', 
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET_NAME'
]

console.log('🔧 Environment Variables Check:')
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: Set`)
  } else {
    console.log(`❌ ${varName}: Not set`)
  }
})

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...')
    console.log('📡 Connection URL:', process.env.MONGO_URL ? 'Set' : 'Not set')
    
    await mongoose.connect(process.env.MONGO_URL)
    
    // Get connection info
    const db = mongoose.connection.db
    const dbName = db.databaseName
    console.log('✅ Connected to MongoDB')
    console.log(`🗄️ Database name: ${dbName}`)
    
    // Test the connection by counting resources
    const resourceCount = await Resource.countDocuments()
    console.log(`📊 Total resources in database: ${resourceCount}`)
    
    // Check if we can find any resources
    const sampleResource = await Resource.findOne()
    if (sampleResource) {
      console.log('✅ Sample resource found:', {
        id: sampleResource._id,
        name: sampleResource.name,
        status: sampleResource.status
      })
    } else {
      console.log('⚠️ No resources found in database')
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// List all files in S3 bucket with pagination
const listAllS3Files = async () => {
  const files = []
  let continuationToken = null
  
  console.log('📋 Fetching all S3 files...')
  
  do {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      ...(continuationToken && { ContinuationToken: continuationToken })
    }
    
    try {
      const response = await s3.listObjectsV2(params).promise()
      
      const fileObjects = response.Contents.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified
      }))
      
      files.push(...fileObjects)
      continuationToken = response.NextContinuationToken
      
      console.log(`📁 Found ${fileObjects.length} files in this batch`)
    } catch (error) {
      console.error('❌ Error listing S3 files:', error)
      throw error
    }
  } while (continuationToken)
  
  console.log(`📊 Total S3 files found: ${files.length}`)
  return files
}

// Get all file references from database
const getAllResourceFiles = async () => {
  console.log('🗄️ Fetching all resource files from database...')
  
  try {
    const resources = await Resource.find({ status: 1 }).lean()

    console.log(`📊 Total resources found: ${resources.length}`)
    
    const dbFiles = new Set()
    
    resources.forEach(resource => {
      // Main file - check in appropriate folder based on resource type
      if (resource.content?.fileName) {
        const folder = resource.resourceType || 'FILES'
        dbFiles.add(`${folder}/${resource.content.fileName}`)
      }
      
      // Thumbnail
      if (resource.content?.thumbnailUrl) {
        dbFiles.add(`THUMBNAILS/${resource.content.thumbnailUrl}`)
      }
      
      // Background image
      if (resource.content?.backgroundImage) {
        dbFiles.add(`BACKGROUNDS/${resource.content.backgroundImage}`)
      }
      
      // Audio file
      if (resource.content?.audioFile) {
        dbFiles.add(`AUDIO/${resource.content.audioFile}`)
      }
      
      // MCQ files
      if (resource.content?.mcq?.imageFile) {
        dbFiles.add(`MCQ_IMAGES/${resource.content.mcq.imageFile}`)
      }
      if (resource.content?.mcq?.audioFile) {
        dbFiles.add(`MCQ_AUDIO/${resource.content.mcq.audioFile}`)
      }
    })
    
    console.log(`📊 Total active resources: ${resources.length}`)
    console.log(`📊 Total database file references: ${dbFiles.size}`)
    return { dbFiles: Array.from(dbFiles), resourceCount: resources.length }
  } catch (error) {
    console.error('❌ Error fetching database files:', error)
    throw error
  }
}

// Delete files from S3 in batches
const deleteS3Files = async (files, batchSize = 10) => {
  console.log(`🗑️ Deleting ${files.length} orphaned files...`)
  
  let deletedCount = 0
  let errorCount = 0
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    
    try {
      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Delete: {
          Objects: batch.map(file => ({ Key: file.key })),
          Quiet: false
        }
      }
      
      const result = await s3.deleteObjects(deleteParams).promise()
      
      deletedCount += result.Deleted?.length || 0
      errorCount += result.Errors?.length || 0
      
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Deleted ${result.Deleted?.length || 0} files`)
      
      if (result.Errors?.length > 0) {
        console.log(`⚠️ Batch ${Math.floor(i / batchSize) + 1}: ${result.Errors.length} errors`)
        result.Errors.forEach(error => {
          console.log(`   - ${error.Key}: ${error.Message}`)
        })
      }
      
      // Add small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, error)
      errorCount += batch.length
    }
  }
  
  return { deletedCount, errorCount }
}

// Generate detailed report
const generateReport = (s3Files, dbFiles, resourceCount, orphanedFiles, deletionResult) => {
  const totalS3Size = s3Files.reduce((sum, file) => sum + file.size, 0)
  const orphanedSize = orphanedFiles.reduce((sum, file) => sum + file.size, 0)
  
  console.log('\n📊 CLEANUP REPORT')
  console.log('='.repeat(50))
  console.log(`📁 Total S3 files: ${s3Files.length}`)
  console.log(`📚 Total active resources: ${resourceCount}`)
  console.log(`🗄️ Database file references: ${dbFiles.length}`)
  console.log(`🧹 Orphaned files found: ${orphanedFiles.length}`)
  console.log(`💾 Total S3 storage: ${(totalS3Size / 1024 / 1024).toFixed(2)} MB`)
  console.log(`🗑️ Orphaned storage: ${(orphanedSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`✅ Files deleted: ${deletionResult.deletedCount}`)
  console.log(`❌ Deletion errors: ${deletionResult.errorCount}`)
  console.log(`💰 Estimated cost savings: $${(orphanedSize / 1024 / 1024 / 1024 * 0.023).toFixed(4)}/month`)
  console.log('='.repeat(50))
}

// Main cleanup function
const cleanupOrphanedFiles = async (dryRun = false) => {
  try {
    console.log('🚀 Starting orphaned file cleanup...')
    console.log(`🔍 Mode: ${dryRun ? 'DRY RUN' : 'LIVE CLEANUP'}`)
    console.log('')
    
    // 1. Get all S3 files
    const s3Files = await listAllS3Files()
    
    // 2. Get all database file references
    const { dbFiles, resourceCount } = await getAllResourceFiles()
    
    // Debug: Show sample files (first 5 of each)
    console.log('\n🔍 DEBUG: Sample S3 files:')
    s3Files.slice(0, 5).forEach(file => {
      console.log(`   - ${file.key} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    })
    if (s3Files.length > 5) {
      console.log(`   ... and ${s3Files.length - 5} more files`)
    }
    
    console.log('\n🔍 DEBUG: Sample database references:')
    dbFiles.slice(0, 5).forEach(file => {
      console.log(`   - ${file}`)
    })
    if (dbFiles.length > 5) {
      console.log(`   ... and ${dbFiles.length - 5} more references`)
    }
    
    // 3. Find orphaned files
    const orphanedFiles = s3Files.filter(s3File => {
      // Compare full S3 key with database references
      return !dbFiles.includes(s3File.key)
    })
    
    console.log(`\n🧹 Found ${orphanedFiles.length} orphaned files`)
    
    if (orphanedFiles.length === 0) {
      console.log('✅ No orphaned files found!')
      return
    }
    
    // Show orphaned files in dry run mode
    if (dryRun) {
      console.log('\n📋 Orphaned files (DRY RUN):')
      orphanedFiles.forEach(file => {
        console.log(`   - ${file.key} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      })
      return
    }
    
    // 4. Delete orphaned files
    const deletionResult = await deleteS3Files(orphanedFiles)
    
    // 5. Generate report
    generateReport(s3Files, dbFiles, resourceCount, orphanedFiles, deletionResult)
    
    console.log('\n✅ Cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// CLI argument parsing
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run') || args.includes('-d')

// Run the cleanup
const main = async () => {
  await connectDB()
  await cleanupOrphanedFiles(dryRun)
  await mongoose.disconnect()
  console.log('👋 Disconnected from MongoDB')
  process.exit(0)
}

main().catch(error => {
  console.error('❌ Script failed:', error)
  process.exit(1)
}) 