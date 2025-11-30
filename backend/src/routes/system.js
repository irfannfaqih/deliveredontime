import { Router } from 'express'
import { query } from '../db/mysql.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ name: 'Delivered API', version: '0.1.0' })
})

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

router.get('/test', (req, res) => {
  res.json({ message: 'test' })
})

router.get('/settings', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM settings ORDER BY id ASC LIMIT 1')
    const s = rows && rows.length ? rows[0] : {}
    res.json({ data: s })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

export default router
