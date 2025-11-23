import { Router } from 'express'
import path from 'path'; // ✅ TAMBAHKAN INI
import { query } from '../db/mysql.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// ✅ ENDPOINT INI TETAP ADA (JANGAN DIHAPUS)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { delivery_id, bbm_record_id, customer_id } = req.query || {}
    if (delivery_id) {
      const rows = await query('SELECT * FROM attachments WHERE delivery_id = ? ORDER BY id DESC', [delivery_id])
      return res.json({ data: rows })
    }
    if (bbm_record_id) {
      const rows = await query('SELECT * FROM bbm_attachments WHERE bbm_record_id = ? ORDER BY id DESC', [bbm_record_id])
      return res.json({ data: rows })
    }
    if (customer_id) {
      const rows = await query('SELECT * FROM customer_attachments WHERE customer_id = ? ORDER BY id DESC', [customer_id])
      return res.json({ data: rows })
    }
    const a = await query('SELECT * FROM attachments ORDER BY id DESC')
    const b = await query('SELECT * FROM bbm_attachments ORDER BY id DESC')
    const c = await query('SELECT * FROM customer_attachments ORDER BY id DESC')
    res.json({ data: [...a, ...b, ...c] })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

// ✅ ENDPOINT INI TETAP ADA (JANGAN DIHAPUS)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id
    const a = await query('SELECT *, "delivery_proof" as category FROM attachments WHERE id = ?', [id])
    if (a.length) return res.json({ data: a[0] })
    const b = await query('SELECT *, "bbm_proof" as category FROM bbm_attachments WHERE id = ?', [id])
    if (b.length) return res.json({ data: b[0] })
    const c = await query('SELECT *, "customer_proof" as category FROM customer_attachments WHERE id = ?', [id])
    if (c.length) return res.json({ data: c[0] })
    res.status(404).json({ error: 'Not found' })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

// ✅ ENDPOINT INI YANG DIPERBAIKI
router.get('/raw/:id', async (req, res) => {
  try {
    const id = req.params.id
    
    // Cek attachments (delivery_proof)
    const a = await query('SELECT *, "delivery_proof" as category FROM attachments WHERE id = ?', [id])
    if (a.length) {
      const row = a[0]
      const absolutePath = path.resolve(row.file_path)
      
      if (row.mime_type) {
        res.setHeader('Content-Type', row.mime_type)
      }
      
      return res.sendFile(absolutePath, (err) => {
        if (err) {
          console.error('Error sending file:', err)
          return res.status(404).json({ error: 'File tidak ditemukan di server' })
        }
      })
    }
    
    // Cek bbm_attachments
    const b = await query('SELECT *, "bbm_proof" as category FROM bbm_attachments WHERE id = ?', [id])
    if (b.length) {
      const row = b[0]
      const absolutePath = path.resolve(row.file_path)
      
      if (row.mime_type) {
        res.setHeader('Content-Type', row.mime_type)
      }
      
      return res.sendFile(absolutePath, (err) => {
        if (err) {
          console.error('Error sending file:', err)
          return res.status(404).json({ error: 'File tidak ditemukan di server' })
        }
      })
    }
    
    // Cek customer_attachments
    const c = await query('SELECT *, "customer_proof" as category FROM customer_attachments WHERE id = ?', [id])
    if (c.length) {
      const row = c[0]
      const absolutePath = path.resolve(row.file_path)
      
      if (row.mime_type) {
        res.setHeader('Content-Type', row.mime_type)
      }
      
      return res.sendFile(absolutePath, (err) => {
        if (err) {
          console.error('Error sending file:', err)
          return res.status(404).json({ error: 'File tidak ditemukan di server' })
        }
      })
    }
    
    res.status(404).json({ error: 'File tidak ditemukan' })
  } catch (e) {
    console.error('Error in /raw/:id:', e)
    res.status(500).json({ error: String(e.message || e) })
  }
})

// ✅ ENDPOINT INI TETAP ADA (JANGAN DIHAPUS)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id
    const a = await query('SELECT *, "delivery_proof" as category FROM attachments WHERE id = ?', [id])
    if (a.length) {
      await query('DELETE FROM attachments WHERE id = ?', [id])
      return res.json({ data: a[0] })
    }
    const b = await query('SELECT *, "bbm_proof" as category FROM bbm_attachments WHERE id = ?', [id])
    if (b.length) {
      await query('DELETE FROM bbm_attachments WHERE id = ?', [id])
      return res.json({ data: b[0] })
    }
    const c = await query('SELECT *, "customer_proof" as category FROM customer_attachments WHERE id = ?', [id])
    if (c.length) {
      await query('DELETE FROM customer_attachments WHERE id = ?', [id])
      return res.json({ data: c[0] })
    }
    res.status(404).json({ error: 'Not found' })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

export default router