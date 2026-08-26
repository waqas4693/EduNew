import express from 'express'
import {
  getStudentProgress,
  updateStudentProgress,
} from '../controllers/studentProgress.js'

const router = express.Router()

router.get('/:studentId/:courseId/:unitId/:sectionId', getStudentProgress)

router.post('/:studentId/:courseId/:unitId/:sectionId/progress', updateStudentProgress)

export default router 