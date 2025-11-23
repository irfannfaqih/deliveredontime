import express from 'express'
import cors from 'cors'
import apiRouter from './routes/index.js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const app = express()
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', apiRouter)

const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'backend/uploads')
app.use('/uploads', express.static(uploadDir))

export default app