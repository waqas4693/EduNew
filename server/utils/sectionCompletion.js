import Resource from '../models/resource.js'
import StudentProgress from '../models/studentProgress.js'
import Section from '../models/section.js'
import Unit from '../models/unit.js'

/**
 * Returns true when every active resource in the section has been completed:
 * - Non-MCQ: present in viewedResources
 * - MCQ: must have mcqProgress.completed === true (view alone is not enough)
 */
export const isSectionFullyCompleted = async ({
  studentId,
  courseId,
  unitId,
  sectionId
}) => {
  const resources = await Resource.find({ sectionId, status: 1 }).select('_id resourceType')

  if (resources.length === 0) {
    return true
  }

  const progress = await StudentProgress.findOne({
    studentId,
    courseId,
    unitId,
    sectionId
  })

  if (!progress) {
    return false
  }

  const viewedIds = new Set(
    (progress.viewedResources || []).map((item) => String(item.resourceId))
  )

  const completedMcqIds = new Set(
    (progress.mcqProgress || [])
      .filter((item) => item.completed === true)
      .map((item) => String(item.resourceId))
  )

  for (const resource of resources) {
    const resourceId = String(resource._id)

    if (resource.resourceType === 'MCQ') {
      if (!completedMcqIds.has(resourceId)) {
        return false
      }
      continue
    }

    if (!viewedIds.has(resourceId)) {
      return false
    }
  }

  return true
}

/**
 * Course-order position for a section (unit.number, then section.number).
 */
export const getSectionPosition = async (sectionId) => {
  const section = await Section.findById(sectionId).select('_id number unitId status')
  if (!section || section.status !== 1) {
    return null
  }

  const unit = await Unit.findById(section.unitId).select('_id number courseId status')
  if (!unit || unit.status !== 1) {
    return null
  }

  return {
    sectionId: section._id,
    sectionNumber: section.number,
    unitId: unit._id,
    unitNumber: unit.number,
    courseId: unit.courseId
  }
}

/**
 * True if candidate is at or beyond current in course order.
 * Missing current means any candidate advances the watermark.
 */
export const isAtOrBeyond = (candidate, current) => {
  if (!current) return true
  if (!candidate) return false

  if (candidate.unitNumber > current.unitNumber) return true
  if (candidate.unitNumber < current.unitNumber) return false
  return candidate.sectionNumber >= current.sectionNumber
}
