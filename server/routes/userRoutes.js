import express from 'express'
import {
  createUser,
  getAssessmentUsers,
  getUsers,
  adminUpdatePassword
} from '../controllers/userController.js'
import { verifyToken, requireAdmin, requireAssessmentRoles } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)

router.post('/create', requireAdmin, createUser)
router.get('/assessment-users', requireAssessmentRoles, getAssessmentUsers)
router.get('/', requireAdmin, getUsers)
router.patch('/:id/password', requireAdmin, adminUpdatePassword)

export default router
