import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'

import loginRoutes from './routes/login.js'
import s3Routes from './routes/s3.js'
import studentRoutes from './routes/student.js'
import courseRoutes from './routes/course.js'
import unitRoutes from './routes/unit.js'
import sectionRoutes from './routes/section.js'
import resourceRoutes from './routes/resource.js'
import authRoutes from './routes/auth.js'

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
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
app.use(morgan('common'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

/* ROUTES */

// Default route
app.get('/', function (req, res) {
  res.json('Server Running')
})

// app.use('/api/login', loginRoutes)
app.use('/s3', s3Routes)
app.use('/student', studentRoutes)
app.use('/courses', courseRoutes)
app.use('/units', unitRoutes)
app.use('/sections', sectionRoutes)
app.use('/resources', resourceRoutes)
app.use('/auth', authRoutes)
mongoose.set('strictQuery', false)

await mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(process.env.PORT)
  })
  .catch(error => console.log(`${error} did not connect`))

export default app