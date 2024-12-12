import express from 'express'
import { 
  createUnit, 
  getCourseUnits,
  updateUnit
} from '../controllers/unit.js'

const router = express.Router()

router.post('/', createUnit)
router.get('/:courseId', getCourseUnits)
router.put('/:id', updateUnit)

export default router 