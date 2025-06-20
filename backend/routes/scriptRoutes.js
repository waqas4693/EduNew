import express from 'express'
import { grantPartialAccess } from '../controllers/scriptController.js'

const router = express.Router()

// Endpoint to grant partial course access to a specific student
router.post('/grant-partial-access', grantPartialAccess)

export default router 