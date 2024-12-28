import express from 'express'
import { 
  createResource, 
  getSectionResources,
  updateResource,
  getResourcesWithViewStatus
} from '../controllers/resource.js'

const router = express.Router()

router.post('/', createResource)
router.get('/:sectionId', getSectionResources)
router.put('/:id', updateResource)
router.get('/:sectionId/student/:studentId/status', getResourcesWithViewStatus)

export default router 