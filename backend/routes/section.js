import express from 'express'
import { 
  createSection, 
//   getSections,
  getUnitSections,
//   getSectionById 
} from '../controllers/section.js'

const router = express.Router()

router.post('/', createSection)
// router.get('/', getSections)
router.get('/:unitId', getUnitSections)
// router.get('/:sectionId', getSectionById)

export default router 