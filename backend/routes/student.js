import express from 'express'
import {
  getDashboardData,
  newStudent,
  getAllStudents,
  updateStudentStatus,
  getStudentCourses,
  assignCourse,
  removeCourse,
  getCourseStudents,
  getUnitProgress
} from '../controllers/student.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/', newStudent)

router.get('/', verifyToken, getAllStudents)
router.get('/:id/courses', getStudentCourses)
router.get('/:id/dashboard', verifyToken, getDashboardData)
router.get('/course/:courseId', verifyToken, getAllStudents)
router.get('/:studentId/courses/:courseId/progress', getUnitProgress)

router.patch('/:id/status', updateStudentStatus)
router.patch('/:id/assign-course', assignCourse)

router.delete('/:id/courses/:courseId', removeCourse)

export default router
