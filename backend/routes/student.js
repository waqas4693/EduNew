import express from 'express'
import { 
  getDashboardData, 
  newStudent, 
  getAllStudents,
  updateStudentStatus,
  getStudentCourses,
  assignCourse,
  removeCourse,
  getCourseStudents
} from '../controllers/student.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/:id/dashboard', verifyToken, getDashboardData)
router.get('/:id/courses', getStudentCourses)
router.get('/', getAllStudents)
router.patch('/:id/status', updateStudentStatus)
router.post('/', newStudent)
router.patch('/:id/assign-course', assignCourse)
router.delete('/:id/courses/:courseId', removeCourse)
router.get('/course/:courseId/students', getCourseStudents)

export default router