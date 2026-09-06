import Course from '../models/course.js'
import Unit from '../models/unit.js'
import Section from '../models/section.js'
import Resource from '../models/resource.js'
import Assessment from '../models/assessment.js'
import AssessmentAttempt from '../models/AssessmentAttempt.js'
import Student from '../models/student.js'
import StudentProgress from '../models/studentProgress.js'
import CourseUnlock from '../models/courseUnlock.js'
import CompletedUnits from '../models/completedUnits.js'
import CompletedSections from '../models/completedSections.js'
import UnitProgress from '../models/unitProgress.js'
import ProgressStats from '../models/progressStats.js'
import CourseStats from '../models/courseStats.js'
import UnitStats from '../models/unitStats.js'
import SectionStats from '../models/sectionStats.js'
import { deleteFromS3 } from '../controllers/s3.js'

const safeDeleteS3 = async (folder, filename) => {
  if (!filename) return
  try {
    await deleteFromS3(folder, filename)
  } catch (error) {
    console.error(`Failed to delete S3 object ${folder}/${filename}:`, error.message)
  }
}

const deleteResourceFiles = async (resource) => {
  if (!resource) return

  await safeDeleteS3(resource.resourceType, resource.content?.fileName)
  await safeDeleteS3('THUMBNAILS', resource.content?.thumbnailUrl)
  await safeDeleteS3('BACKGROUNDS', resource.content?.backgroundImage)
  await safeDeleteS3('AUDIO', resource.content?.audioFile)
  await safeDeleteS3('MCQ_IMAGES', resource.content?.mcq?.imageFile)
  await safeDeleteS3('MCQ_AUDIO', resource.content?.mcq?.audioFile)
}

const deleteAssessmentFiles = async (assessment) => {
  if (!assessment) return

  for (const mcq of assessment.content?.mcqs || []) {
    await safeDeleteS3('MCQ_IMAGES', mcq.imageFile)
    await safeDeleteS3('MCQ_AUDIO', mcq.audioFile)
  }

  await safeDeleteS3('ASSESSMENT_FILES', assessment.content?.assessmentFile)
  await safeDeleteS3('ASSESSMENT_FILES', assessment.content?.supportingFile)
}

const scrubResourceFromProgress = async (resourceId, sectionId) => {
  await StudentProgress.updateMany(
    { sectionId },
    {
      $pull: {
        mcqProgress: { resourceId },
        viewedResources: { resourceId }
      }
    }
  )

  await StudentProgress.updateMany(
    { lastAccessedResource: resourceId },
    { $unset: { lastAccessedResource: '' } }
  )
}

export const hardDeleteAssessment = async (assessmentId) => {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) {
    const error = new Error('Assessment not found')
    error.statusCode = 404
    throw error
  }

  const attempts = await AssessmentAttempt.find({ assessmentId })
  for (const attempt of attempts) {
    await safeDeleteS3('ASSESSMENT_SUBMISSIONS', attempt.content?.submittedFile)
    await safeDeleteS3('ASSESSMENT_FEEDBACK', attempt.feedbackFile)
  }
  await AssessmentAttempt.deleteMany({ assessmentId })

  await deleteAssessmentFiles(assessment)
  await Assessment.findByIdAndDelete(assessmentId)

  await Section.findByIdAndUpdate(assessment.sectionId, {
    $pull: { assessments: assessmentId }
  })

  await SectionStats.findOneAndUpdate(
    { sectionId: assessment.sectionId },
    { $inc: { totalAssessments: -1 } }
  )

  return assessment
}

export const hardDeleteResource = async (resourceId) => {
  const resource = await Resource.findById(resourceId)
  if (!resource) {
    const error = new Error('Resource not found')
    error.statusCode = 404
    throw error
  }

  await deleteResourceFiles(resource)
  await scrubResourceFromProgress(resource._id, resource.sectionId)
  await Resource.findByIdAndDelete(resourceId)

  await Section.findByIdAndUpdate(resource.sectionId, {
    $pull: { resources: resourceId }
  })

  const statsDecrement = { totalResources: -1 }
  if (resource.resourceType === 'MCQ') {
    statsDecrement.totalMcqs = -1
  }

  await SectionStats.findOneAndUpdate(
    { sectionId: resource.sectionId },
    { $inc: statsDecrement }
  )

  return resource
}

export const hardDeleteSection = async (sectionId) => {
  const section = await Section.findById(sectionId)
  if (!section) {
    const error = new Error('Section not found')
    error.statusCode = 404
    throw error
  }

  const resources = await Resource.find({ sectionId })
  for (const resource of resources) {
    await hardDeleteResource(resource._id)
  }

  const assessments = await Assessment.find({ sectionId })
  for (const assessment of assessments) {
    await hardDeleteAssessment(assessment._id)
  }

  await SectionStats.deleteMany({ sectionId })
  await StudentProgress.deleteMany({ sectionId })
  await CompletedSections.deleteMany({ sectionId })

  await CourseUnlock.updateMany(
    { unlockedSection: sectionId },
    { $unset: { unlockedSection: '' } }
  )

  await Section.findByIdAndDelete(sectionId)

  await Unit.findByIdAndUpdate(section.unitId, {
    $pull: { sections: sectionId }
  })

  await UnitStats.findOneAndUpdate(
    { unitId: section.unitId },
    { $inc: { totalSections: -1 } }
  )

  return section
}

export const hardDeleteUnit = async (unitId) => {
  const unit = await Unit.findById(unitId)
  if (!unit) {
    const error = new Error('Unit not found')
    error.statusCode = 404
    throw error
  }

  const sections = await Section.find({ unitId })
  for (const section of sections) {
    await hardDeleteSection(section._id)
  }

  await UnitStats.deleteMany({ unitId })
  await CompletedUnits.deleteMany({ unitId })
  await UnitProgress.deleteMany({ unitId })
  await StudentProgress.deleteMany({ unitId })

  await CourseUnlock.updateMany(
    { unlockedUnit: unitId },
    { $unset: { unlockedUnit: '', unlockedSection: '' } }
  )

  await Unit.findByIdAndDelete(unitId)

  await Course.findByIdAndUpdate(unit.courseId, {
    $pull: { units: unitId }
  })

  await CourseStats.findOneAndUpdate(
    { courseId: unit.courseId },
    { $inc: { totalUnits: -1 } }
  )

  return unit
}

export const hardDeleteCourse = async (courseId) => {
  const course = await Course.findById(courseId)
  if (!course) {
    const error = new Error('Course not found')
    error.statusCode = 404
    throw error
  }

  const units = await Unit.find({ courseId })
  for (const unit of units) {
    await hardDeleteUnit(unit._id)
  }

  await CourseStats.deleteMany({ courseId })
  await StudentProgress.deleteMany({ courseId })
  await CourseUnlock.deleteMany({ courseId })
  await CompletedUnits.deleteMany({ courseId })
  await CompletedSections.deleteMany({ courseId })
  await UnitProgress.deleteMany({ courseId })
  await ProgressStats.deleteMany({ courseId })

  await Student.updateMany(
    { 'courses.courseId': courseId },
    { $pull: { courses: { courseId } } }
  )

  await safeDeleteS3('THUMBNAILS', course.thumbnail)
  await Course.findByIdAndDelete(courseId)

  return course
}
