import express from 'express'
import {
  createCourse,
  getCourses,
  getEnrolledCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
  getInactiveCourses
} from '../controllers/course.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.post('/', requireAdmin, createCourse)
router.get('/', getCourses)
router.get('/inactive', requireAdmin, getInactiveCourses)
router.get('/enrolled', getEnrolledCourses)
router.get('/:id', getCourseById)
router.put('/:id', requireAdmin, updateCourse)
router.patch('/:id/status', requireAdmin, updateCourseStatus)

export default router
