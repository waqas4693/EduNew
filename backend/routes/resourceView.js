import express from 'express'
import { 
  recordResourceView,
  getResourceViewsByStudent,
  getAllResourceViews
} from '../controllers/resourceView.js'

const   router = express.Router()

// Record a new resource view
router.post('/record', recordResourceView)

// Get views for a specific student
router.get('/student/:studentId', getResourceViewsByStudent)

// Get all resource views (admin only)
router.get('/all', getAllResourceViews)

export default router 