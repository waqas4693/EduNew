import express from 'express'
import { createSection } from '../controllers/section.js'

const router = express.Router()

router.post('/', createSection)

export default router 