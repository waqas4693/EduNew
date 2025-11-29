import express from 'express'
import { 
  getUnlockedUnitAndSection, 
  setUnlockedUnitAndSection,
  getCompletedUnits
} from '../controllers/courseUnlock.js'

const router = express.Router()

// Get unlocked sections and units for a student in a course
router.get('/:studentId/:courseId', getUnlockedUnitAndSection)

// Get completed units for a student in a course
router.get('/completed/:studentId/:courseId', getCompletedUnits)

// Check section completion and unlock next section/unit if needed
router.post('/check-completion', setUnlockedUnitAndSection)

export default router 