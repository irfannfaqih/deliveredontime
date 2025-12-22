import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import apiRouter from './routes/index.js'

dotenv.config()

const app = express()
const allowed = process.env.ALLOWED_ORIGINS || '*'
const corsOptions = allowed === '*'
  ? { origin: true, credentials: true, optionsSuccessStatus: 204 }
  : {
      origin: (origin, cb) => {
        const rawList = allowed.split(',').map(s => s.trim()).filter(Boolean)
        const toHost = (v) => {
          try { return new URL(v).hostname } catch { return String(v).replace(/^https?:\/\//, '').split('/')[0] }
        }
        const listHosts = rawList.map(toHost).map(h => h.replace(/^www\./, ''))
        const oHost = origin ? toHost(origin).replace(/^www\./, '') : ''
        if (!origin || listHosts.includes(oHost)) return cb(null, true)
        cb(new Error('Not allowed by CORS'))
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
      optionsSuccessStatus: 204
    }
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('trust proxy', 1)

// Routes
app.use('/api', apiRouter)

// Static files
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'backend/uploads')
app.use('/uploads', express.static(uploadDir))

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Endpoint tidak ditemukan' })
})

app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS', message: 'Origin tidak diizinkan' })
  }
  res.status(500).json({ error: 'ServerError', message: process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kesalahan server' })
})

export default app
