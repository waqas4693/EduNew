import Course from '../models/course.js'
import Unit from '../models/unit.js'
import Section from '../models/section.js'
import CourseUnlock from '../models/courseUnlock.js'
import CompletedUnits from '../models/completedUnits.js'
import CompletedSections from '../models/completedSections.js'
import Student from '../models/student.js'
import { getSectionPosition } from './sectionCompletion.js'

const toId = (value) => (value == null ? null : String(value))

/**
 * Find the section immediately after the watermark in course order.
 * If there is no watermark, returns the first section of the first unit.
 */
export const getImmediateNextSectionPosition = async (courseId, currentSectionId = null) => {
  const units = await Unit.find({ courseId, status: 1 }).sort({ number: 1 }).lean()

  if (!currentSectionId) {
    for (const unit of units) {
      const firstSection = await Section.findOne({ unitId: unit._id, status: 1 })
        .sort({ number: 1 })
        .lean()
      if (firstSection) {
        return getSectionPosition(firstSection._id)
      }
    }
    return null
  }

  const current = await getSectionPosition(currentSectionId)
  if (!current) return null

  const sectionsInUnit = await Section.find({ unitId: current.unitId, status: 1 })
    .sort({ number: 1 })
    .lean()

  const currentIndex = sectionsInUnit.findIndex(
    (section) => toId(section._id) === toId(current.sectionId)
  )

  if (currentIndex !== -1 && currentIndex + 1 < sectionsInUnit.length) {
    return getSectionPosition(sectionsInUnit[currentIndex + 1]._id)
  }

  const unitIndex = units.findIndex((unit) => toId(unit._id) === toId(current.unitId))
  for (let i = unitIndex + 1; i < units.length; i += 1) {
    const firstSection = await Section.findOne({ unitId: units[i]._id, status: 1 })
      .sort({ number: 1 })
      .lean()
    if (firstSection) {
      return getSectionPosition(firstSection._id)
    }
  }

  return null
}

/**
 * True if candidate is the watermark section itself (idempotent) or the immediate next section.
 * Never jumps over gaps.
 */
export const isSameOrImmediateNext = async (courseId, candidateSectionId, currentSectionId) => {
  if (!candidateSectionId) return false

  if (currentSectionId && toId(candidateSectionId) === toId(currentSectionId)) {
    return true
  }

  const next = await getImmediateNextSectionPosition(courseId, currentSectionId || null)
  return Boolean(next && toId(next.sectionId) === toId(candidateSectionId))
}

const isDemoStudent = async (studentId) => {
  const student = await Student.findById(studentId).select('isDemo').lean()
  return Boolean(student?.isDemo)
}

/**
 * Whether a section in a unit is unlocked by the CourseUnlock watermark.
 * Never defaults to "unlock all" when metadata cannot be resolved.
 */
export const isSectionUnlockedByWatermark = async ({
  courseId,
  unitId,
  sectionId,
  sectionsInUnit,
  unlockDoc
}) => {
  const orderedSections = sectionsInUnit || []

  if (!unlockDoc?.unlockedSection) {
    const firstUnit = await Unit.findOne({ courseId, status: 1 }).sort({ number: 1 }).lean()
    if (!firstUnit || toId(firstUnit._id) !== toId(unitId)) {
      // Unit may still open via unlockedUnit pointer for the next unit's first section
      if (unlockDoc?.unlockedUnit) {
        const unlockedUnitDoc = await Unit.findById(unlockDoc.unlockedUnit).select('number').lean()
        const currentUnit = await Unit.findById(unitId).select('number').lean()
        if (
          unlockedUnitDoc &&
          currentUnit &&
          currentUnit.number === unlockedUnitDoc.number + 1
        ) {
          return toId(orderedSections[0]?._id) === toId(sectionId)
        }
      }
      return false
    }
    return toId(orderedSections[0]?._id) === toId(sectionId)
  }

  const watermark = await getSectionPosition(unlockDoc.unlockedSection)
  const currentUnit = await Unit.findById(unitId).select('number').lean()

  if (!watermark || !currentUnit) {
    return false
  }

  // Fully behind the watermark → all sections open for review/navigation
  if (currentUnit.number < watermark.unitNumber) {
    return true
  }

  // Watermark lives in this unit → unlock through completed + next
  if (toId(watermark.unitId) === toId(unitId)) {
    const watermarkIndex = orderedSections.findIndex(
      (section) => toId(section._id) === toId(watermark.sectionId)
    )
    const currentIndex = orderedSections.findIndex(
      (section) => toId(section._id) === toId(sectionId)
    )
    return (
      watermarkIndex !== -1 &&
      currentIndex !== -1 &&
      currentIndex <= watermarkIndex + 1
    )
  }

  // Next unit after watermark → first section only
  if (currentUnit.number === watermark.unitNumber + 1) {
    return toId(orderedSections[0]?._id) === toId(sectionId)
  }

  // Fallback using unlockedUnit pointer
  if (unlockDoc?.unlockedUnit) {
    const unlockedUnitDoc = await Unit.findById(unlockDoc.unlockedUnit).select('number').lean()
    if (unlockedUnitDoc) {
      if (currentUnit.number <= unlockedUnitDoc.number) {
        return true
      }
      if (currentUnit.number === unlockedUnitDoc.number + 1) {
        return toId(orderedSections[0]?._id) === toId(sectionId)
      }
    }
  }

  return false
}

/**
 * Units page payload: course + each unit with unlocked/completed/canOpen.
 */
export const buildUnitsUnlockView = async (studentId, courseId) => {
  const course = await Course.findById(courseId).select('name thumbnail').lean()
  if (!course) {
    const error = new Error('Course not found')
    error.statusCode = 404
    throw error
  }

  const units = await Unit.find({ courseId, status: 1 }).sort({ number: 1 }).lean()
  const unlockDoc = await CourseUnlock.findOne({ studentId, courseId }).lean()
  const completedUnitIds = new Set(
    (
      await CompletedUnits.find({ studentId, courseId, status: 1 }).select('unitId').lean()
    ).map((row) => toId(row.unitId))
  )

  const demo = await isDemoStudent(studentId)

  let maxUnlockedIndex = 0
  if (unlockDoc?.unlockedUnit) {
    const unlockedIndex = units.findIndex(
      (unit) => toId(unit._id) === toId(unlockDoc.unlockedUnit)
    )
    maxUnlockedIndex = unlockedIndex === -1 ? 0 : unlockedIndex + 1
  }

  return {
    course: {
      id: toId(course._id),
      name: course.name,
      thumbnail: course.thumbnail || null
    },
    units: units.map((unit, index) => {
      const unlocked = demo || index <= maxUnlockedIndex
      const completed = completedUnitIds.has(toId(unit._id))
      return {
        _id: unit._id,
        name: unit.name,
        number: unit.number,
        sections: unit.sections || [],
        unlocked,
        completed,
        canOpen: unlocked || completed
      }
    })
  }
}

/**
 * Sections page payload: course + unit + each section with unlocked/completed/canOpen.
 */
export const buildSectionsUnlockView = async (studentId, courseId, unitId) => {
  const unitsView = await buildUnitsUnlockView(studentId, courseId)
  const unitRow = unitsView.units.find((unit) => toId(unit._id) === toId(unitId))

  if (!unitRow) {
    const error = new Error('Unit not found in this course')
    error.statusCode = 404
    throw error
  }

  const unitDoc = await Unit.findById(unitId).select('name number courseId').lean()
  if (!unitDoc || toId(unitDoc.courseId) !== toId(courseId)) {
    const error = new Error('Unit not found')
    error.statusCode = 404
    throw error
  }

  const sections = await Section.find({ unitId, status: 1 }).sort({ number: 1 }).lean()
  const unlockDoc = await CourseUnlock.findOne({ studentId, courseId }).lean()
  const completedSectionIds = new Set(
    (
      await CompletedSections.find({
        studentId,
        courseId,
        unitId,
        status: 1
      })
        .select('sectionId')
        .lean()
    ).map((row) => toId(row.sectionId))
  )

  const demo = await isDemoStudent(studentId)
  const unitAccessible = unitRow.canOpen

  const sectionRows = []
  for (const section of sections) {
    const completed = completedSectionIds.has(toId(section._id))
    let unlocked = false

    if (demo) {
      unlocked = true
    } else if (unitAccessible) {
      unlocked = await isSectionUnlockedByWatermark({
        courseId,
        unitId,
        sectionId: section._id,
        sectionsInUnit: sections,
        unlockDoc
      })
    }

    sectionRows.push({
      _id: section._id,
      name: section.name,
      number: section.number,
      resources: section.resources || [],
      assessments: section.assessments || [],
      unlocked,
      completed,
      canOpen: unlocked || completed
    })
  }

  return {
    course: unitsView.course,
    unit: {
      _id: unitDoc._id,
      id: toId(unitDoc._id),
      name: unitDoc.name,
      number: unitDoc.number,
      unlocked: unitRow.unlocked,
      completed: unitRow.completed,
      canOpen: unitRow.canOpen
    },
    sections: sectionRows
  }
}

/**
 * Server gate for studying / recording progress in a section.
 */
export const assertSectionCanOpen = async ({ studentId, courseId, unitId, sectionId }) => {
  const view = await buildSectionsUnlockView(studentId, courseId, unitId)
  const section = view.sections.find((row) => toId(row._id) === toId(sectionId))

  if (!section) {
    const error = new Error('Section not found')
    error.statusCode = 404
    throw error
  }

  if (!section.canOpen) {
    const error = new Error('Section is locked. Complete previous sections to continue.')
    error.statusCode = 403
    throw error
  }

  return section
}
