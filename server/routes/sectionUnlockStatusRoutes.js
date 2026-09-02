import express from 'express'
import {
  getUnlockedUnitAndSection,
  setUnlockedUnitAndSection,
  getCompletedUnits,
  getCompletedSections,
  getStudentCourseUnlockStatus,
  syncCourseUnlockFromProgress,
  repairCourseUnlockFromProgress,
  repairAllCourseUnlocks
} from '../controllers/courseUnlock.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.get('/completed/:studentId/:courseId', getCompletedUnits)
router.get('/completed-sections/:studentId/:courseId', getCompletedSections)
router.get('/status/:studentId/:courseId', getStudentCourseUnlockStatus)
router.post('/sync', syncCourseUnlockFromProgress)
router.post('/check-completion', setUnlockedUnitAndSection)
router.get('/:studentId/:courseId', getUnlockedUnitAndSection)
router.post('/repair', requireAdmin, repairCourseUnlockFromProgress)
router.post('/repair-all', requireAdmin, repairAllCourseUnlocks)

export default router
