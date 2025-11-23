import { Router } from 'express'

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

export default router