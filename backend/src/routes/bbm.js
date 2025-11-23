import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { query } from '../db/mysql.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM bbm_records ORDER BY id DESC')
    res.json({ data: rows })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM bbm_records WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ data: rows[0] })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { tanggal, kilometer_awal, kilometer_akhir, messenger, courier_id, created_by, attachment } = req.body || {}
    if (!tanggal || !kilometer_awal || !kilometer_akhir || !messenger) return res.status(400).json({ error: 'Invalid' })
    const r = await query('INSERT INTO bbm_records (tanggal,kilometer_awal,kilometer_akhir,messenger,attachment,courier_id,created_by) VALUES (?,?,?,?,?,?,?)', [tanggal, kilometer_awal, kilometer_akhir, messenger, attachment || 'View', courier_id || null, created_by || null])
    const id = r.insertId
    const rows = await query('SELECT * FROM bbm_records WHERE id = ?', [id])
    res.json({ data: rows[0] })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { tanggal, kilometer_awal, kilometer_akhir, messenger, attachment, courier_id } = req.body || {}
    await query('UPDATE bbm_records SET tanggal=COALESCE(?,tanggal), kilometer_awal=COALESCE(?,kilometer_awal), kilometer_akhir=COALESCE(?,kilometer_akhir), messenger=COALESCE(?,messenger), attachment=COALESCE(?,attachment), courier_id=COALESCE(?,courier_id) WHERE id=?', [tanggal || null, kilometer_awal || null, kilometer_akhir || null, messenger || null, attachment || null, courier_id || null, req.params.id])
    const rows = await query('SELECT * FROM bbm_records WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ data: rows[0] })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM bbm_records WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    await query('DELETE FROM bbm_records WHERE id = ?', [req.params.id])
    res.json({ data: rows[0] })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const totalRows = await query('SELECT COUNT(*) as c FROM bbm_records')
    res.json({ data: { total: totalRows[0].c } })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

export default router