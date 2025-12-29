import UnitProgress from '../models/unitProgress.js'
import UnitStats from '../models/unitStats.js'
import CompletedSections from '../models/completedSections.js'
import Unit from '../models/unit.js'

export const calculateAndUpdateUnitProgress = async (studentId, courseId, unitId) => {
  try {
    const unitStats = await UnitStats.findOne({ unitId })
    
    if (!unitStats) {
      console.log(`⚠️ UnitStats not found for unit ${unitId}`)
      return 0
    }
    
    const totalSections = unitStats.totalSections
    
    if (totalSections === 0) {
      console.log(`⚠️ No sections found for unit ${unitId}`)
      return 0
    }
    
    const completedSectionsCount = await CompletedSections.countDocuments({
      studentId,
      courseId,
      unitId,
      status: 1
    })
    
    const percentage = totalSections > 0
      ? Math.round((completedSectionsCount / totalSections) * 100)
      : 0
    
    await UnitProgress.findOneAndUpdate(
      { studentId, courseId, unitId },
      { percentage },
      { upsert: true, new: true }
    )
    
    console.log(`✅ Unit progress updated: ${percentage}% (${completedSectionsCount}/${totalSections}) for unit ${unitId}`)
    
    return percentage
  } catch (error) {
    console.error('❌ Error calculating unit progress:', error)
    throw error
  }
}

export const recalculateAllUnitProgress = async (studentId, courseId) => {
  try {
    console.log(`🔄 Recalculating unit progress for student ${studentId} in course ${courseId}`)
    
    const units = await Unit.find({ courseId, status: 1 })
    
    if (units.length === 0) {
      console.log(`⚠️ No units found for course ${courseId}`)
      return
    }
    
    for (const unit of units) {
      await calculateAndUpdateUnitProgress(studentId, courseId, unit._id)
    }
    
    console.log(`✅ Unit progress recalculation completed for ${units.length} units`)
  } catch (error) {
    console.error('❌ Error recalculating all unit progress:', error)
    throw error
  }
}