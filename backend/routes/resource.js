import express from 'express'
import { createResource } from '../controllers/resource.js'

const router = express.Router()

router.post('/', createResource)

export default router 