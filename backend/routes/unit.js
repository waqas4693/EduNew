import express from 'express'
import { 
  createUnit, 
//   getUnits,
  getCourseUnits,
//   getUnitById 
} from '../controllers/unit.js'

const router = express.Router()

router.post('/', createUnit)
// router.get('/', getUnits)
router.get('/:courseId', getCourseUnits)
// router.get('/:unitId', getUnitById)

export default router 