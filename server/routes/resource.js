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
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.post('/', requireAdmin, createResource)
router.post('/insert', requireAdmin, insertResource)
router.get('/latest-number/:sectionId', getLatestResourceNumber)
router.get('/:sectionId/search', searchResourcesByName)
router.get('/:sectionId', getSectionResources)
router.put('/:id', requireAdmin, updateResource)
router.delete('/:id', requireAdmin, deleteResource)
router.patch('/:id/number', requireAdmin, updateResourceNumber)

export default router
