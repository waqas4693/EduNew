import mongoose from 'mongoose'
import Student from '../models/student.js'
import Course from '../models/course.js'
import Unit from '../models/unit.js'
import Section from '../models/section.js'
import Resource from '../models/resource.js'
import StudentProgress from '../models/studentProgress.js'
import CourseUnlock from '../models/courseUnlock.js'
import { handleError } from '../utils/errorHandler.js'

export const grantPartialAccess = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const studentId = '6808eb226e2da15e7ece7b58'
    const courseId = '679cdc4903149d0fa3926b75'

    // 1. Fetch the first two units of the course
    const units = await Unit.find({ courseId }).sort({ number: 1 }).limit(2).session(session)
    if (units.length === 0) {
      throw new Error('No units found for this course.')
    }

    const unitIdsToUnlock = units.map(u => u._id)
    const sectionsToProcess = []

    // 2. Get all sections for the first unit
    const firstUnitSections = await Section.find({ unitId: units[0]._id }).sort({ number: 1 }).session(session)
    sectionsToProcess.push(...firstUnitSections)

    // 3. Get only the first section of the second unit (if it exists)
    if (units.length > 1) {
      const secondUnitFirstSection = await Section.findOne({ unitId: units[1]._id }).sort({ number: 1 }).session(session)
      if (secondUnitFirstSection) {
        sectionsToProcess.push(secondUnitFirstSection)
      }
    }
    
    const sectionIdsToUnlock = sectionsToProcess.map(s => s._id)

    // 4. Update SectionUnlockStatus
    await CourseUnlock.findOneAndUpdate(
      { studentId, courseId },
      { $addToSet: { unlockedUnits: { $each: unitIdsToUnlock }, unlockedSections: { $each: sectionIdsToUnlock } } },
      { upsert: true, session }
    )

    // 5. Simulate 100% progress for each section
    for (const section of sectionsToProcess) {
      const resources = await Resource.find({ sectionId: section._id }).session(session)
      const resourceIds = resources.map(r => r._id)
      const mcqResources = resources.filter(r => r.resourceType === 'MCQ')

      const mcqProgress = mcqResources.map(mcq => ({
        resourceId: mcq._id,
        completed: true,
        attempts: 1,
      }))

      await StudentProgress.findOneAndUpdate(
        { studentId, courseId, unitId: section.unitId, sectionId: section._id },
        {
          $set: {
            viewedResources: resourceIds.map(id => ({ resourceId: id })),
            mcqProgress,
            resourceProgressPercentage: 100,
            mcqProgressPercentage: 100,
            lastAccessedResource: resourceIds[resourceIds.length - 1] || null,
          }
        },
        { upsert: true, session }
      )
    }

    await session.commitTransaction()
    res.status(200).json({ success: true, message: 'Partial access granted successfully.' })
  } catch (error) {
    await session.abortTransaction()
    handleError(res, error)
  } finally {
    session.endSession()
  }
} 