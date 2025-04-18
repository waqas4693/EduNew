import express from 'express'
import { 
  createResource, 
  getSectionResources,
  updateResource,
  getResourcesWithViewStatus,
  getLatestResourceNumber,
  updateResourceNumber,
  insertResource,
  searchResourcesByName
} from '../controllers/resource.js'

const router = express.Router()

router.post('/', createResource)
router.get('/:sectionId', getSectionResources)
router.get('/:sectionId/search', searchResourcesByName)
router.put('/:id', updateResource)
router.get('/:sectionId/student/:studentId/status', getResourcesWithViewStatus)
router.get('/latest-number/:sectionId', getLatestResourceNumber)
router.patch('/:id/number', updateResourceNumber)
router.post('/insert', insertResource)

export default router 