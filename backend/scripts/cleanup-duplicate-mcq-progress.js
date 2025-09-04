import mongoose from 'mongoose'
import StudentProgress from '../models/studentProgress.js'
import SectionStats from '../models/sectionStats.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const cleanupDuplicateMcqProgress = async () => {
  try {
    console.log('🧹 Starting cleanup of duplicate MCQ progress entries...')
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edusupplements')
    console.log('✅ Connected to MongoDB')
    
    // Get all student progress records
    const progressRecords = await StudentProgress.find({})
    console.log(`📊 Found ${progressRecords.length} progress records to check`)
    
    let totalDuplicatesRemoved = 0
    let recordsUpdated = 0
    
    for (const progress of progressRecords) {
      const originalMcqProgress = progress.mcqProgress
      
      // Create a map to track unique MCQs by resourceId
      const uniqueMcqs = new Map()
      
      // Process MCQ progress entries, keeping only the latest completed entry for each resource
      for (const mcq of originalMcqProgress) {
        const resourceId = mcq.resourceId.toString()
        
        if (!uniqueMcqs.has(resourceId)) {
          // First entry for this resource
          uniqueMcqs.set(resourceId, mcq)
        } else {
          // Check if this is a completed entry and the existing one is not
          if (mcq.completed && !uniqueMcqs.get(resourceId).completed) {
            uniqueMcqs.set(resourceId, mcq)
          } else if (mcq.completed && uniqueMcqs.get(resourceId).completed) {
            // Both are completed, keep the one with more attempts or later timestamp
            const existing = uniqueMcqs.get(resourceId)
            if (mcq.attempts > existing.attempts || 
                (mcq.attempts === existing.attempts && mcq.lastAttemptAt > existing.lastAttemptAt)) {
              uniqueMcqs.set(resourceId, mcq)
            }
          } else if (!mcq.completed && !uniqueMcqs.get(resourceId).completed) {
            // Both are incomplete, keep the one with more attempts or later timestamp
            const existing = uniqueMcqs.get(resourceId)
            if (mcq.attempts > existing.attempts || 
                (mcq.attempts === existing.attempts && mcq.lastAttemptAt > existing.lastAttemptAt)) {
              uniqueMcqs.set(resourceId, mcq)
            }
          }
        }
      }
      
      // Convert map back to array
      const cleanedMcqProgress = Array.from(uniqueMcqs.values())
      
      // Check if we removed any duplicates
      if (cleanedMcqProgress.length < originalMcqProgress.length) {
        const duplicatesRemoved = originalMcqProgress.length - cleanedMcqProgress.length
        totalDuplicatesRemoved += duplicatesRemoved
        
        console.log(`🔧 Progress record ${progress._id}: Removed ${duplicatesRemoved} duplicate MCQ entries`)
        console.log(`   Before: ${originalMcqProgress.length} entries, After: ${cleanedMcqProgress.length} entries`)
        
        // Update the progress record
        await StudentProgress.findByIdAndUpdate(
          progress._id,
          { mcqProgress: cleanedMcqProgress }
        )
        
        recordsUpdated++
      }
    }
    
    console.log(`\n📈 Cleanup Summary:`)
    console.log(`   Records checked: ${progressRecords.length}`)
    console.log(`   Records updated: ${recordsUpdated}`)
    console.log(`   Total duplicates removed: ${totalDuplicatesRemoved}`)
    
    // Now recalculate all progress percentages
    console.log('\n🔄 Recalculating progress percentages...')
    
    for (const progress of progressRecords) {
      try {
        await progress.updateProgressPercentages()
      } catch (error) {
        console.error(`❌ Error updating progress for record ${progress._id}:`, error.message)
      }
    }
    
    console.log('✅ Progress percentages recalculated')
    
    // Verify no progress percentages exceed 100%
    console.log('\n🔍 Verifying progress percentages...')
    const invalidProgress = await StudentProgress.find({
      $or: [
        { mcqProgressPercentage: { $gt: 100 } },
        { resourceProgressPercentage: { $gt: 100 } }
      ]
    })
    
    if (invalidProgress.length > 0) {
      console.log(`⚠️  Found ${invalidProgress.length} records with progress > 100%:`)
      for (const record of invalidProgress) {
        console.log(`   Record ${record._id}: MCQ=${record.mcqProgressPercentage}%, Resource=${record.resourceProgressPercentage}%`)
      }
    } else {
      console.log('✅ All progress percentages are within valid range (0-100%)')
    }
    
    console.log('\n🎉 Cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close()
    console.log('🔌 MongoDB connection closed')
  }
}

// Run the cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupDuplicateMcqProgress()
}

export default cleanupDuplicateMcqProgress
