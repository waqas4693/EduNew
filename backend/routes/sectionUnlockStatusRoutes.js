import express from 'express'
import { 
  getUnlockStatus, 
  checkAndUnlockNext,
  unlockSection,
  unlockUnit
} from '../controllers/sectionUnlockStatusController.js'

const router = express.Router()

// Get unlocked sections and units for a student in a course
router.get('/:studentId/:courseId', getUnlockStatus)

// Check section completion and unlock next section/unit if needed
router.post('/check-completion', checkAndUnlockNext)

// Manually unlock a section (for admin use)
router.post('/unlock-section/:studentId/:courseId/:sectionId', unlockSection)

// Manually unlock a unit (for admin use)
router.post('/unlock-unit/:studentId/:courseId/:unitId', unlockUnit)

export default router 