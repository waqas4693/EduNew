import express from 'express'
import { getDashboardData } from '../controllers/student.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/:id/dashboard', verifyToken, getDashboardData)

export default router