import express from 'express'
import { 
  createResource, 
  getSectionResources,
//   getResourceById 
} from '../controllers/resource.js'

const router = express.Router()

router.post('/', createResource)
router.get('/:sectionId', getSectionResources)
// router.get('/:resourceId', getResourceById)

export default router 