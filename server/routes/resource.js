import express from 'express'
import { 
  createResource, 
  getSectionResources,
  updateResource,
  getLatestResourceNumber,
  updateResourceNumber,
  insertResource,
  searchResourcesByName,
  deleteResource
} from '../controllers/resource.js'

const router = express.Router()

router.post('/', createResource)
router.get('/:sectionId', getSectionResources)
router.get('/:sectionId/search', searchResourcesByName)
router.put('/:id', updateResource)
router.delete('/:id', deleteResource)
router.get('/latest-number/:sectionId', getLatestResourceNumber)
router.patch('/:id/number', updateResourceNumber)
router.post('/insert', insertResource)

export default router 