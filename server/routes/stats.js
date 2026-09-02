import express from 'express'
import {
  getCourseStats,
  getUnitStats,
  getSectionStats
} from '../controllers/stats.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)
router.use(requireAdmin)

router.get('/course/:courseId', getCourseStats)
router.get('/unit/:unitId', getUnitStats)
router.get('/section/:sectionId', getSectionStats)

export default router
