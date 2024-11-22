import express from 'express'
import { 
  createCourse, 
  getCourses, 
  getEnrolledCourses,
//   getCourseById 
} from '../controllers/course.js'

const router = express.Router()

router.post('/', createCourse)
router.get('/', getCourses)
router.get('/enrolled', getEnrolledCourses)
// router.get('/:courseId', getCourseById)

export default router 