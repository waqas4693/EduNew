import express from 'express'
import { getDashboardData, newStudent } from '../controllers/student.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/:id/dashboard', verifyToken, getDashboardData)
router.post('/', newStudent)

export default router