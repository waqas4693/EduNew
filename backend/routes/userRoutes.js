import express from 'express'
import { createUser, getAssessmentUsers } from '../controllers/userController.js'

const router = express.Router()

router.post('/create', createUser)
router.get('/assessment-users', getAssessmentUsers)

export default router 