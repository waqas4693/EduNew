import express from 'express'
import { grantPartialAccess } from '../controllers/scriptController.js'

const router = express.Router()

// Endpoint to grant partial course access to a specific student
router.get('/grant-partial-access', grantPartialAccess)

export default router 