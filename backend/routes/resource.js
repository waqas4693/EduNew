import express from 'express'
import { 
  createResource, 
  getSectionResources,
  updateResource
} from '../controllers/resource.js'

const router = express.Router()

router.post('/', createResource)
router.get('/:sectionId', getSectionResources)
router.put('/:id', updateResource)

export default router 