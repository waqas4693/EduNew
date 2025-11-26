import express from 'express'
import { 
  getUnlockedUnitAndSection, 
  setUnlockedUnitAndSection
} from '../controllers/courseUnlock.js'

const router = express.Router()

// Get unlocked sections and units for a student in a course
router.get('/:studentId/:courseId', getUnlockedUnitAndSection)

// Check section completion and unlock next section/unit if needed
router.post('/check-completion', setUnlockedUnitAndSection)

export default router 