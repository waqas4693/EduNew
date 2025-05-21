import express from 'express'
import {
  getCourseStats,
  getUnitStats,
  getSectionStats
} from '../controllers/stats.js'

const router = express.Router()

// Course stats routes
router.get('/course/:courseId', getCourseStats)

// Unit stats routes
router.get('/unit/:unitId', getUnitStats)

// Section stats routes
router.get('/section/:sectionId', getSectionStats)

export default router 