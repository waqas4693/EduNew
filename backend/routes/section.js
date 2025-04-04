import express from 'express'
import { 
  createSection, 
  getUnitSections,
  updateSection,
  getLatestSectionNumber,
  updateSectionNumber,
  swapSectionNumbers,
  insertSection
} from '../controllers/section.js'

const router = express.Router()

router.post('/', createSection)
router.get('/:unitId', getUnitSections)
router.patch('/:id', updateSection)
router.get('/latest-number/:unitId', getLatestSectionNumber)
router.patch('/:id/number', updateSectionNumber)
router.post('/swap-numbers', swapSectionNumbers)
router.post('/insert', insertSection)

export default router 