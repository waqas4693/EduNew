import express from 'express'
import { 
  createCourse, 
  getCourses, 
  getEnrolledCourses,
  getCourseById,
  updateCourse 
} from '../controllers/course.js'

const router = express.Router()

router.post('/', createCourse)
router.get('/', getCourses)
router.get('/enrolled', getEnrolledCourses)
router.get('/:id', getCourseById)
router.put('/:id', updateCourse)

export default router 