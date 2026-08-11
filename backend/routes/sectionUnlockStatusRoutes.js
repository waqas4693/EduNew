import express from 'express'
import {
  getUnlockedUnitAndSection,
  setUnlockedUnitAndSection,
  getCompletedUnits,
  getCompletedSections,
  getStudentCourseUnlockStatus,
  syncCourseUnlockFromProgress
} from '../controllers/courseUnlock.js'

const router = express.Router()

// Specific paths must be registered before /:studentId/:courseId
router.get('/completed/:studentId/:courseId', getCompletedUnits)
router.get('/completed-sections/:studentId/:courseId', getCompletedSections)
router.get('/status/:studentId/:courseId', getStudentCourseUnlockStatus)
router.post('/sync', syncCourseUnlockFromProgress)
router.post('/check-completion', setUnlockedUnitAndSection)
router.get('/:studentId/:courseId', getUnlockedUnitAndSection)

export default router
