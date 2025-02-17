import express from 'express'
import { 
  createSection, 
  getUnitSections,
  updateSection,
  getLatestSectionNumber
} from '../controllers/section.js'

const router = express.Router()

router.post('/', createSection)
router.get('/:unitId', getUnitSections)
router.put('/:id', updateSection)
router.get('/latest-number/:unitId', getLatestSectionNumber)

export default router 