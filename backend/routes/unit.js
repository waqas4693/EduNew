import express from 'express'
import { 
  createUnit, 
  getCourseUnits,
  updateUnit,
  getLatestUnitNumber
} from '../controllers/unit.js'

const router = express.Router()

router.post('/', createUnit)
router.get('/:courseId', getCourseUnits)
router.put('/:id', updateUnit)
router.get('/latest-number/:courseId', getLatestUnitNumber)

export default router 