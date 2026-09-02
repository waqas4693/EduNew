import express from 'express'
import {
  createSection,
  getUnitSections,
  updateSection,
  getLatestSectionNumber,
  swapSectionNumbers,
  insertSection
} from '../controllers/section.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.post('/', requireAdmin, createSection)
router.post('/swap-numbers', requireAdmin, swapSectionNumbers)
router.post('/insert', requireAdmin, insertSection)
router.get('/latest-number/:unitId', getLatestSectionNumber)
router.get('/:unitId', getUnitSections)
router.patch('/:id', requireAdmin, updateSection)

export default router
