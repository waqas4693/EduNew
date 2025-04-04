import express from 'express'
import { 
  createResource, 
  getSectionResources,
  updateResource,
  getResourcesWithViewStatus,
  getLatestResourceNumber,
  updateResourceNumber
} from '../controllers/resource.js'

const router = express.Router()

router.post('/', createResource)
router.get('/:sectionId', getSectionResources)
router.put('/:id', updateResource)
router.get('/:sectionId/student/:studentId/status', getResourcesWithViewStatus)
router.get('/latest-number/:sectionId', getLatestResourceNumber)
router.patch('/:id/number', updateResourceNumber)

export default router 