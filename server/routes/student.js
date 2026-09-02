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
  getUnitProgress,
  getStudentById,
  getDashboardStats
} from '../controllers/student.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.post('/', requireAdmin, newStudent)
router.get('/', requireAdmin, getAllStudents)
router.get('/stats', requireAdmin, getDashboardStats)
router.get('/course/:courseId', requireAdmin, getCourseStudents)
router.get('/:studentId/courses/:courseId/progress', getUnitProgress)
router.get('/:id/courses', getStudentCourses)
router.get('/:id/dashboard', getDashboardData)
router.get('/:id', getStudentById)
router.patch('/:id/status', requireAdmin, updateStudentStatus)
router.patch('/:id/assign-course', requireAdmin, assignCourse)
router.delete('/:id/courses/:courseId', requireAdmin, removeCourse)

export default router
