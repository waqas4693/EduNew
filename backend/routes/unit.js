import express from 'express'
import { createUnit } from '../controllers/unit.js'

const router = express.Router()

router.post('/', createUnit)

export default router 