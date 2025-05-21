import express from 'express'
import {
  getStudentSectionProgress,
  updateProgress,
  getCourseMcqProgress
} from '../controllers/studentProgress.js'

const router = express.Router()

// Get progress for a specific section
router.get('/:studentId/:courseId/:unitId/:sectionId', getStudentSectionProgress)

// Update progress (MCQ and/or resource view)
router.post('/:studentId/:courseId/:unitId/:sectionId/progress', updateProgress)

// Get overall MCQ progress for a course
router.get('/:studentId/:courseId/mcq-progress', getCourseMcqProgress)

export default router 