import express from 'express'
import { 
  getUnlockedSections, 
  checkSectionCompletion,
  unlockSection
} from '../controllers/sectionUnlockStatusController.js'

const router = express.Router()

// Get unlocked sections for a student in a unit
router.get('/:studentId/:courseId/:unitId', getUnlockedSections)

// Check if a section is completed and unlock next section if needed
router.get('/check-completion/:studentId/:courseId/:unitId/:sectionId', checkSectionCompletion)

// Manually unlock a section (for admin use)
router.post('/unlock/:studentId/:courseId/:unitId/:sectionId', unlockSection)

export default router 