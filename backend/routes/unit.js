import express from 'express'
import { 
  createUnit, 
  getCourseUnits,
  updateUnit,
  getLatestUnitNumber,
  updateUnitNumber,
  swapUnitNumbers,
  insertUnit
} from '../controllers/unit.js'

const router = express.Router()

router.post('/', createUnit)
router.get('/:courseId', getCourseUnits)
router.patch('/:id', updateUnit)
router.get('/latest-number/:courseId', getLatestUnitNumber)
router.patch('/:id/number', updateUnitNumber)
router.post('/swap-numbers', swapUnitNumbers)
router.post('/insert', insertUnit)

export default router 