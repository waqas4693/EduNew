import express from 'express'
import {
  getStudentSectionProgress,
  updateMcqProgress,
  updateLastAccessedResource,
  getCourseMcqProgress
} from '../controllers/studentProgress.js'

const router = express.Router()

// Get progress for a specific section
router.get('/:studentId/:courseId/:unitId/:sectionId', getStudentSectionProgress)

// Update MCQ progress
router.post('/:studentId/:courseId/:unitId/:sectionId/:resourceId', updateMcqProgress)

// Update last accessed resource
router.put('/:studentId/:courseId/:unitId/:sectionId/last-resource', updateLastAccessedResource)

// Get overall MCQ progress for a course
router.get('/:studentId/:courseId/mcq-progress', getCourseMcqProgress)

export default router 