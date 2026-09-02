import express from 'express'
import { grantPartialAccess } from '../controllers/scriptController.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(verifyToken)
router.get('/grant-partial-access', requireAdmin, grantPartialAccess)

export default router
