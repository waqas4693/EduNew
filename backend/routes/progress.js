import express from 'express'
import {
  getUnitProgress,
  getCourseProgress,
  getAllCourseProgress
} from '../controllers/progressController.js'

const router = express.Router()

// Get unit progress for a student in a course
router.get('/unit/:studentId/:courseId', getUnitProgress)

// Get course progress for a student
router.get('/course/:studentId/:courseId', getCourseProgress)

// Get all course progress for a student (for dashboard)
router.get('/all-courses/:studentId', getAllCourseProgress)

export default router 