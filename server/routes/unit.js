import express from 'express'
import {
  createUnit,
  getCourseUnits,
  updateUnit,
  getLatestUnitNumber,
  swapUnitNumbers,
  insertUnit
} from '../controllers/unit.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.post('/', requireAdmin, createUnit)
router.post('/swap-numbers', requireAdmin, swapUnitNumbers)
router.post('/insert', requireAdmin, insertUnit)
router.get('/latest-number/:courseId', getLatestUnitNumber)
router.get('/:courseId', getCourseUnits)
router.patch('/:id', requireAdmin, updateUnit)

export default router
