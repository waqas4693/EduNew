import express from 'express'
import { 
  createSection, 
  getUnitSections,
  updateSection
} from '../controllers/section.js'

const router = express.Router()

router.post('/', createSection)
router.get('/:unitId', getUnitSections)
router.put('/:id', updateSection)

export default router 