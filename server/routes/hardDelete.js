import express from 'express'
import { verifyToken, requireAdmin } from '../middleware/auth.js'
import {
  hardDeleteAssessmentHandler,
  hardDeleteCourseHandler,
  hardDeleteResourceHandler,
  hardDeleteSectionHandler,
  hardDeleteUnitHandler
} from '../controllers/hardDelete.js'

const router = express.Router()

router.use(verifyToken, requireAdmin)

router.post('/courses/:id', hardDeleteCourseHandler)
router.post('/units/:id', hardDeleteUnitHandler)
router.post('/sections/:id', hardDeleteSectionHandler)
router.post('/resources/:id', hardDeleteResourceHandler)
router.post('/assessments/:id', hardDeleteAssessmentHandler)

export default router
