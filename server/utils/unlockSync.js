import Resource from '../models/resource.js'
import StudentProgress from '../models/studentProgress.js'
import Section from '../models/section.js'
import Unit from '../models/unit.js'
import CourseUnlock from '../models/courseUnlock.js'
import CompletedSections from '../models/completedSections.js'
import CompletedUnits from '../models/completedUnits.js'
import Student from '../models/student.js'
import { calculateAndUpdateUnitProgress } from './unitProgressCalculator.js'
import { isSectionFullyCompleted } from './sectionCompletion.js'

/**
 * Legacy heal: if an MCQ was recorded as viewed, treat it as completed.
 * Older clients often wrote viewedResources without mcqProgress.completed=true.
 */
export const healLegacyProgressForCourse = async (studentId, courseId) => {
  const progresses = await StudentProgress.find({ studentId, courseId })
  let healedProgressDocs = 0
  let healedMcqFlags = 0

  for (const progress of progresses) {
    let changed = false
    const viewedIds = new Set(
      (progress.viewedResources || []).map((item) => String(item.resourceId))
    )

    for (let i = 0; i < (progress.mcqProgress || []).length; i++) {
      const mcq = progress.mcqProgress[i]
      if (!mcq.completed && viewedIds.has(String(mcq.resourceId))) {
        progress.mcqProgress[i].completed = true
        progress.mcqProgress[i].completedAt = mcq.completedAt || new Date()
        changed = true
        healedMcqFlags += 1
      }
    }

    const mcqResources = await Resource.find({
      sectionId: progress.sectionId,
      status: 1,
      resourceType: 'MCQ'
    }).select('_id')

    for (const resource of mcqResources) {
      const resourceId = String(resource._id)
      if (!viewedIds.has(resourceId)) continue

      const existingIndex = (progress.mcqProgress || []).findIndex(
        (item) => String(item.resourceId) === resourceId
      )

      if (existingIndex === -1) {
        progress.mcqProgress.push({
          resourceId: resource._id,
          completed: true,
          completedAt: new Date(),
          attempts: 1,
          lastAttemptAt: new Date()
        })
        changed = true
        healedMcqFlags += 1
      } else if (!progress.mcqProgress[existingIndex].completed) {
        progress.mcqProgress[existingIndex].completed = true
        progress.mcqProgress[existingIndex].completedAt =
          progress.mcqProgress[existingIndex].completedAt || new Date()
        changed = true
        healedMcqFlags += 1
      }
    }

    if (changed) {
      await progress.save()
      await progress.updateProgressPercentages()
      healedProgressDocs += 1
    } else if (progress) {
      await progress.updateProgressPercentages()
    }
  }

  return { healedProgressDocs, healedMcqFlags }
}

/**
 * Build ordered course structure with live progress / unlock diagnostics.
 */
export const buildStudentCourseStatus = async (studentId, courseId) => {
  const unlockDoc = await CourseUnlock.findOne({ studentId, courseId }).lean()

  const units = await Unit.find({ courseId, status: 1 }).sort({ number: 1 }).lean()
  const completedUnitIds = new Set(
    (
      await CompletedUnits.find({ studentId, courseId, status: 1 }).select('unitId').lean()
    ).map((row) => String(row.unitId))
  )
  const completedSectionIds = new Set(
    (
      await CompletedSections.find({ studentId, courseId, status: 1 }).select('sectionId').lean()
    ).map((row) => String(row.sectionId))
  )

  const unitReports = []
  let contiguousComplete = true
  let expectedNext = null

  for (const unit of units) {
    const sections = await Section.find({ unitId: unit._id, status: 1 })
      .sort({ number: 1 })
      .lean()

    const sectionReports = []
    let unitAllComplete = sections.length > 0

    for (const section of sections) {
      let progress = await StudentProgress.findOne({
        studentId,
        courseId,
        unitId: unit._id,
        sectionId: section._id
      })

      if (progress) {
        await progress.updateProgressPercentages()
        progress = await StudentProgress.findById(progress._id)
      }

      const resources = await Resource.find({ sectionId: section._id, status: 1 })
        .select('_id name number resourceType')
        .sort({ number: 1 })
        .lean()

      const viewedIds = new Set(
        (progress?.viewedResources || []).map((item) => String(item.resourceId))
      )
      const completedMcqIds = new Set(
        (progress?.mcqProgress || [])
          .filter((item) => item.completed === true)
          .map((item) => String(item.resourceId))
      )

      const resourceReports = resources.map((resource) => {
        const id = String(resource._id)
        const isMcq = resource.resourceType === 'MCQ'
        const viewed = viewedIds.has(id)
        const mcqCompleted = completedMcqIds.has(id)
        const done = isMcq ? mcqCompleted : viewed

        return {
          resourceId: id,
          name: resource.name,
          number: resource.number,
          resourceType: resource.resourceType,
          viewed,
          mcqCompleted: isMcq ? mcqCompleted : null,
          done
        }
      })

      const materialsComplete = await isSectionFullyCompleted({
        studentId,
        courseId,
        unitId: unit._id,
        sectionId: section._id
      })

      const markedComplete = completedSectionIds.has(String(section._id))
      const inContiguousPath = contiguousComplete

      if (!materialsComplete) {
        unitAllComplete = false
        if (contiguousComplete && !expectedNext) {
          expectedNext = {
            unitId: String(unit._id),
            unitNumber: unit.number,
            unitName: unit.name,
            sectionId: String(section._id),
            sectionNumber: section.number,
            sectionName: section.name
          }
        }
        contiguousComplete = false
      }

      sectionReports.push({
        sectionId: String(section._id),
        name: section.name,
        number: section.number,
        materialsComplete,
        markedComplete,
        resourceProgressPercentage: progress?.resourceProgressPercentage ?? 0,
        mcqProgressPercentage: progress?.mcqProgressPercentage ?? 0,
        totalResources: resources.length,
        viewedCount: resourceReports.filter((r) => r.viewed).length,
        mismatch: materialsComplete !== markedComplete,
        wouldUnlockNextIfSynced: inContiguousPath && materialsComplete,
        resources: resourceReports
      })
    }

    if (sections.length === 0) {
      unitAllComplete = false
    }

    const markedUnitComplete = completedUnitIds.has(String(unit._id))

    unitReports.push({
      unitId: String(unit._id),
      name: unit.name,
      number: unit.number,
      materialsComplete: unitAllComplete,
      markedComplete: markedUnitComplete,
      mismatch: unitAllComplete !== markedUnitComplete,
      sections: sectionReports
    })
  }

  return {
    studentId: String(studentId),
    courseId: String(courseId),
    unlockWatermark: {
      unlockedUnit: unlockDoc?.unlockedUnit ? String(unlockDoc.unlockedUnit) : null,
      unlockedSection: unlockDoc?.unlockedSection ? String(unlockDoc.unlockedSection) : null,
      lastUpdated: unlockDoc?.lastUpdated || unlockDoc?.updatedAt || null
    },
    expectedNextIncomplete: expectedNext,
    units: unitReports
  }
}

/**
 * Rebuild CompletedSections / CompletedUnits / CourseUnlock from live material progress.
 * Only advances through contiguous completed sections from the start of the course.
 */
export const syncStudentCourseUnlock = async (studentId, courseId) => {
  const units = await Unit.find({ courseId, status: 1 }).sort({ number: 1 })

  let lastContiguousCompletedSectionId = null
  let lastFullyCompletedUnitId = null
  let stillContiguous = true
  const syncedSections = []
  const syncedUnits = []

  for (const unit of units) {
    const sections = await Section.find({ unitId: unit._id, status: 1 }).sort({ number: 1 })
    let unitFullyComplete = sections.length > 0

    for (const section of sections) {
      const progress = await StudentProgress.findOne({
        studentId,
        courseId,
        unitId: unit._id,
        sectionId: section._id
      })

      if (progress) {
        await progress.updateProgressPercentages()
      }

      const complete = await isSectionFullyCompleted({
        studentId,
        courseId,
        unitId: unit._id,
        sectionId: section._id
      })

      if (complete) {
        await CompletedSections.findOneAndUpdate(
          { studentId, courseId, unitId: unit._id, sectionId: section._id },
          { status: 1 },
          { upsert: true, new: true }
        )

        syncedSections.push(String(section._id))

        if (stillContiguous) {
          lastContiguousCompletedSectionId = section._id
        }
      } else {
        unitFullyComplete = false
        stillContiguous = false
      }
    }

    if (unitFullyComplete) {
      await CompletedUnits.findOneAndUpdate(
        { studentId, courseId, unitId: unit._id },
        { status: 1 },
        { upsert: true, new: true }
      )
      syncedUnits.push(String(unit._id))

      const lastSection = sections[sections.length - 1]
      if (
        lastSection &&
        lastContiguousCompletedSectionId &&
        String(lastContiguousCompletedSectionId) === String(lastSection._id)
      ) {
        lastFullyCompletedUnitId = unit._id
      }
    } else {
      await CompletedUnits.findOneAndUpdate(
        { studentId, courseId, unitId: unit._id },
        { status: 0 },
        { upsert: true }
      )
    }

    try {
      await calculateAndUpdateUnitProgress(studentId, courseId, unit._id)
    } catch (error) {
      console.error('Error updating unit progress during sync:', error)
    }
  }

  const unlockUpdate = {
    lastUpdated: Date.now()
  }

  if (lastContiguousCompletedSectionId) {
    unlockUpdate.unlockedSection = lastContiguousCompletedSectionId
  }

  if (lastFullyCompletedUnitId) {
    unlockUpdate.unlockedUnit = lastFullyCompletedUnitId
  } else {
    unlockUpdate.unlockedUnit = null
  }

  if (!lastContiguousCompletedSectionId) {
    unlockUpdate.unlockedSection = null
  }

  const unlockStatus = await CourseUnlock.findOneAndUpdate(
    { studentId, courseId },
    { $set: unlockUpdate },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return {
    unlockedUnit: unlockStatus.unlockedUnit,
    unlockedSection: unlockStatus.unlockedSection,
    syncedSectionCount: syncedSections.length,
    syncedUnitCount: [...new Set(syncedUnits)].length,
    syncedSections,
    syncedUnits: [...new Set(syncedUnits)]
  }
}

/**
 * Heal legacy progress then sync unlock for one student+course.
 */
export const repairStudentCourseUnlock = async (studentId, courseId) => {
  const healResult = await healLegacyProgressForCourse(studentId, courseId)
  const syncResult = await syncStudentCourseUnlock(studentId, courseId)
  return { healResult, syncResult }
}

/**
 * One-time style repair across all active students and their active course enrollments.
 */
export const repairAllStudentCourseUnlocks = async () => {
  const students = await Student.find({ status: 1 })
    .select('_id name courses')
    .lean()

  const results = []
  let processed = 0
  let failed = 0

  for (const student of students) {
    const activeCourses = (student.courses || []).filter(
      (course) => course.courseStatus === 1 && course.courseId
    )

    for (const enrollment of activeCourses) {
      const courseId = enrollment.courseId
      try {
        const repair = await repairStudentCourseUnlock(student._id, courseId)
        processed += 1
        results.push({
          studentId: String(student._id),
          studentName: student.name,
          courseId: String(courseId),
          success: true,
          ...repair
        })
      } catch (error) {
        failed += 1
        results.push({
          studentId: String(student._id),
          studentName: student.name,
          courseId: String(courseId),
          success: false,
          error: error.message
        })
      }
    }
  }

  return {
    studentCount: students.length,
    processed,
    failed,
    results
  }
}
