import SectionUnlockStatus from '../models/sectionUnlockStatus.js'
import StudentProgress from '../models/studentProgress.js'
import Section from '../models/section.js'
import SectionStats from '../models/sectionStats.js'
import { handleError } from '../utils/errorHandler.js'
import Unit from '../models/unit.js'
import { calculateAndSaveUnitProgress } from '../utils/progressCalculator.js'

// Get unlocked sections and units for a student in a course
export const getUnlockStatus = async (req, res) => {
  try {
    const { studentId, courseId } = req.params

    // Find or create unlock status
    let unlockStatus = await SectionUnlockStatus.findOne({
      studentId,
      courseId
    })

    // If no unlock status exists, create one with the first unit and section unlocked
    if (!unlockStatus) {
      // Get the first unit of the course
      const firstUnit = await Unit.findOne({ courseId }).sort({ number: 1 })
      
      if (!firstUnit) {
        return res.status(200).json({ 
          success: true, 
          unlockedUnits: [],
          unlockedSections: []
        })
      }

      // Get the first section of the first unit
      const firstSection = await Section.findOne({ unitId: firstUnit._id }).sort({ number: 1 })
      
      if (!firstSection) {
        return res.status(200).json({ 
          success: true, 
          unlockedUnits: [],
          unlockedSections: []
        })
      }

      unlockStatus = await SectionUnlockStatus.create({
        studentId,
        courseId,
        unlockedUnits: [firstUnit._id],
        unlockedSections: [firstSection._id]
      })
    } else {
      // For existing unlock status, ensure first sections are unlocked for all unlocked units
      const unlockedUnits = unlockStatus.unlockedUnits
      for (const unitId of unlockedUnits) {
        const firstSection = await Section.findOne({ unitId }).sort({ number: 1 })
        if (firstSection && !unlockStatus.unlockedSections.includes(firstSection._id)) {
          unlockStatus.unlockedSections.push(firstSection._id)
        }
      }
      if (unlockStatus.isModified('unlockedSections')) {
        await unlockStatus.save()
      }
    }

    res.status(200).json({
      success: true,
      unlockedUnits: unlockStatus.unlockedUnits,
      unlockedSections: unlockStatus.unlockedSections
    })
  } catch (error) {
    handleError(res, error)
  }
}

// Check section completion and unlock next section/unit if needed
export const checkAndUnlockNext = async (req, res) => {

  console.log('🔍 Checking request body:', req.body)

  try {
    const { studentId, courseId, unitId, sectionId } = req.body
    console.log('🔍 Checking section completion:', { studentId, courseId, unitId, sectionId })

    // Get student progress for the section
    const studentProgress = await StudentProgress.findOne({
      studentId,
      courseId,
      unitId,
      sectionId
    })

    if (!studentProgress) {
      console.log('❌ No progress found for this section')
      return res.status(200).json({
        success: true,
        isCompleted: false,
        message: 'No progress found for this section'
      })
    }

    // Get section stats for total resources count
    const sectionStats = await SectionStats.findOne({ sectionId })
    if (!sectionStats) {
      console.log('❌ Section stats not found')
      return res.status(404).json({
        success: false,
        message: 'Section stats not found'
      })
    }

    // Check if all resources are viewed
    const isCompleted = studentProgress.viewedResources.length === sectionStats.totalResources
    console.log('📊 Section completion status:', {
      viewedResources: studentProgress.viewedResources.length,
      totalResources: sectionStats.totalResources,
      isCompleted
    })

    if (isCompleted) {
      console.log('✅ Section is completed, checking for next section/unit')
      
      // Calculate and save unit progress
      try {
        await calculateAndSaveUnitProgress(studentId, courseId, unitId)
        console.log('✅ Unit progress calculated and saved')
      } catch (error) {
        console.error('❌ Error calculating unit progress:', error)
        // Continue with unlock logic even if progress calculation fails
      }
      
      // Get current section and its unit
      const currentSection = await Section.findById(sectionId)
      if (!currentSection) {
        console.log('❌ Section not found')
        return res.status(404).json({
          success: false,
          message: 'Section not found'
        })
      }
      console.log('📑 Current section:', { 
        id: currentSection._id, 
        number: currentSection.number 
      })

      // Get the unit
      const currentUnit = await Unit.findById(unitId)
      if (!currentUnit) {
        console.log('❌ Unit not found')
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        })
      }
      console.log('📚 Current unit:', { 
        id: currentUnit._id, 
        number: currentUnit.number 
      })

      // Get the last section number in the current unit
      const lastSectionInUnit = await Section.findOne({ unitId })
        .sort({ number: -1 })
        .select('number')
      console.log('🔢 Last section in unit:', { 
        number: lastSectionInUnit?.number 
      })

      // Get the last unit number in the course
      const lastUnitInCourse = await Unit.findOne({ courseId })
        .sort({ number: -1 })
        .select('number')
      console.log('🔢 Last unit in course:', { 
        number: lastUnitInCourse?.number 
      })

      // Get or create unlock status
      let unlockStatus = await SectionUnlockStatus.findOne({
        studentId,
        courseId
      })

      if (!unlockStatus) {
        console.log('🆕 Creating new unlock status')
        unlockStatus = await SectionUnlockStatus.create({
          studentId,
          courseId,
          unlockedUnits: [unitId],
          unlockedSections: [sectionId]
        })
      }
      console.log('🔓 Current unlock status:', {
        unlockedUnits: unlockStatus.unlockedUnits.length,
        unlockedSections: unlockStatus.unlockedSections.length
      })

      // If current section is not the last in the unit
      if (currentSection.number < lastSectionInUnit.number) {
        console.log('📑 Current section is not last in unit, unlocking next section')
        // Get the next section
        const nextSection = await Section.findOne({
          unitId,
          number: currentSection.number + 1
        })

        if (nextSection) {
          console.log('🔓 Unlocking next section:', { 
            id: nextSection._id, 
            number: nextSection.number 
          })
          await unlockStatus.unlockSection(nextSection._id)
        }
      } 
      // If current section is the last in the unit
      else if (currentSection.number === lastSectionInUnit.number) {
        console.log('📑 Current section is last in unit, checking unit status')
        // If current unit is not the last in the course
        if (currentUnit.number < lastUnitInCourse.number) {
          console.log('📚 Current unit is not last in course, unlocking next unit')
          // Get the next unit
          const nextUnit = await Unit.findOne({
            courseId,
            number: currentUnit.number + 1
          })

          if (nextUnit) {
            console.log('🔓 Unlocking next unit:', { 
              id: nextUnit._id, 
              number: nextUnit.number 
            })
            await unlockStatus.unlockUnit(nextUnit._id)

            // Get and unlock the first section of the next unit
            const firstSectionOfNextUnit = await Section.findOne({
              unitId: nextUnit._id
            }).sort({ number: 1 })

            if (firstSectionOfNextUnit) {
              console.log('🔓 Unlocking first section of next unit:', {
                id: firstSectionOfNextUnit._id,
                number: firstSectionOfNextUnit.number
              })
              await unlockStatus.unlockSection(firstSectionOfNextUnit._id)
            }
          }
        } else {
          console.log('🏆 Course completed! This is the last unit')
        }
      }
    }

    console.log('✅ Section completion check completed')
    res.status(200).json({
      success: true,
      isCompleted,
      totalResources: sectionStats.totalResources,
      viewedResources: studentProgress.viewedResources.length
    })
  } catch (error) {
    console.error('❌ Error in checkAndUnlockNext:', error)
    handleError(res, error)
  }
}

// Manually unlock a specific section (for admin use)
export const unlockSection = async (req, res) => {
  try {
    const { studentId, courseId, sectionId } = req.params
    
    const unlockStatus = await SectionUnlockStatus.findOneAndUpdate(
      { studentId, courseId },
      { 
        $addToSet: { unlockedSections: sectionId },
        lastUpdated: Date.now()
      },
      { upsert: true }
    )
    
    res.status(200).json({
      success: true,
      message: 'Section unlocked successfully'
    })
  } catch (error) {
    handleError(res, error)
  }
}

// Manually unlock a specific unit (for admin use)
export const unlockUnit = async (req, res) => {
  try {
    const { studentId, courseId, unitId } = req.params
    
    const unlockStatus = await SectionUnlockStatus.findOneAndUpdate(
      { studentId, courseId },
      { 
        $addToSet: { unlockedUnits: unitId },
        lastUpdated: Date.now()
      },
      { upsert: true }
    )

    // Get and unlock the first section of the unit
    const firstSection = await Section.findOne({
      unitId
    }).sort({ number: 1 })

    if (firstSection) {
      await SectionUnlockStatus.findOneAndUpdate(
        { studentId, courseId },
        {
          $addToSet: { unlockedSections: firstSection._id },
          lastUpdated: Date.now()
        }
      )
    }
    
    res.status(200).json({
      success: true,
      message: 'Unit and its first section unlocked successfully'
    })
  } catch (error) {
    handleError(res, error)
  }
} 