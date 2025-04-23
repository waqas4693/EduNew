import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import multer from 'multer'
import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'

import { dirname } from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import unitRoutes from './routes/unit.js'
import uploadRoutes from './routes/upload.js'
import courseRoutes from './routes/course.js'
import studentRoutes from './routes/student.js'
import sectionRoutes from './routes/section.js'
import userRoutes from './routes/userRoutes.js'
import resourceRoutes from './routes/resource.js'
import assessmentRoutes from './routes/assessment.js'
import resourceViewRoutes from './routes/resourceView.js'
import assessmentReviewRoutes from './routes/assessmentReview.js'
import assessmentAttemptRoutes from './routes/assessmentAttempt.js'
import s3Routes from './routes/s3.js'
import sectionUnlockStatusRoutes from './routes/sectionUnlockStatusRoutes.js'
import studentProgressRoutes from './routes/studentProgress.js'
import bulkUploadRoutes from './routes/bulkUpload.js'

/* CONFIGURATION */
dotenv.config()
const app = express()
app.use(
  cors({
    origin: true,
    credentials: true
  })
)
app.use(express.json())
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      childSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameAncestors: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(morgan('common'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/* ROUTES */

// Default route
app.get('/api/', function (req, res) {
  res.json('Server Running')
})

app.use('/api/auth', authRoutes)
app.use('/api/units', unitRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/sections', sectionRoutes)
app.use('/api/resources', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'mcqImage', maxCount: 1 },
  { name: 'mcqAudio', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 }
]), resourceRoutes)
app.use('/api/section-unlock', sectionUnlockStatusRoutes)

app.use('/api/assessments', assessmentRoutes)
app.use('/api/assessment-attempts', assessmentAttemptRoutes)
app.use('/api/assessment-review', assessmentReviewRoutes)
app.use('/api/resource-views', resourceViewRoutes)
app.use('/api/resources/files', s3Routes)
app.use('/api/upload', uploadRoutes)
app.use('/api/users', userRoutes)
app.use('/api/bulk-upload', bulkUploadRoutes)
app.use('/api/student-progress', studentProgressRoutes)
mongoose.set('strictQuery', false)

await mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT)
    console.log(`Server running on port ${process.env.PORT}`)
  })
  .catch(error => console.log(`${error} did not connect`))

export default app