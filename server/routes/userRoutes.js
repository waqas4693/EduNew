import express from 'express'
import { createUser, getAssessmentUsers } from '../controllers/userController.js'
import { verifyToken, requireAdmin, requireAssessmentRoles } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.post('/create', requireAdmin, createUser)
router.get('/assessment-users', requireAssessmentRoles, getAssessmentUsers)

export default router
