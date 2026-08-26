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

const router = express.Router()

router.post('/', createCourse)
router.get('/', getCourses)
router.get('/inactive', getInactiveCourses)
router.get('/enrolled', getEnrolledCourses)
router.get('/:id', getCourseById)
router.put('/:id', updateCourse)
router.patch('/:id/status', updateCourseStatus)

export default router 