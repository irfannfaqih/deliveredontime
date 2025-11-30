import { Router } from 'express'
import { query } from '../db/mysql.js'
import { requireAuth } from '../middleware/auth.js'

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
    const settingsRows = await query('SELECT fuel_price, km_per_liter FROM settings ORDER BY id ASC LIMIT 1')
    const fuelPrice = settingsRows.length ? Number(settingsRows[0].fuel_price) || 10000 : 10000
    const kmPerLiter = settingsRows.length ? Number(settingsRows[0].km_per_liter) || 35 : 35
    const kmAwal = parseInt(kilometer_awal || 0, 10) || 0
    const kmAkhir = parseInt(kilometer_akhir || 0, 10) || 0
    const totalKm = kmAkhir - kmAwal
    const jumlahBbmRupiah = ((totalKm || 0) / kmPerLiter) * fuelPrice
    const r = await query('INSERT INTO bbm_records (tanggal,kilometer_awal,kilometer_akhir,total_kilometer,messenger,attachment,courier_id,created_by,jumlah_bbm_rupiah) VALUES (?,?,?,?,?,?,?,?,?)', [tanggal, kilometer_awal, kilometer_akhir, totalKm, messenger, attachment || 'View', courier_id || null, created_by || null, jumlahBbmRupiah])
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
    const currentRows = await query('SELECT kilometer_awal, kilometer_akhir FROM bbm_records WHERE id = ?', [req.params.id])
    if (!currentRows.length) return res.status(404).json({ error: 'Not found' })
    const nextKmAwal = (kilometer_awal ?? currentRows[0].kilometer_awal)
    const nextKmAkhir = (kilometer_akhir ?? currentRows[0].kilometer_akhir)
    const settingsRows = await query('SELECT fuel_price, km_per_liter FROM settings ORDER BY id ASC LIMIT 1')
    const fuelPrice = settingsRows.length ? Number(settingsRows[0].fuel_price) || 10000 : 10000
    const kmPerLiter = settingsRows.length ? Number(settingsRows[0].km_per_liter) || 35 : 35
    const kmAwal = parseInt(nextKmAwal || 0, 10) || 0
    const kmAkhir = parseInt(nextKmAkhir || 0, 10) || 0
    const totalKm = kmAkhir - kmAwal
    const jumlahBbmRupiah = ((totalKm || 0) / kmPerLiter) * fuelPrice
    await query('UPDATE bbm_records SET tanggal=COALESCE(?,tanggal), kilometer_awal=COALESCE(?,kilometer_awal), kilometer_akhir=COALESCE(?,kilometer_akhir), total_kilometer=?, jumlah_bbm_rupiah=?, messenger=COALESCE(?,messenger), attachment=COALESCE(?,attachment), courier_id=COALESCE(?,courier_id) WHERE id=?', [tanggal || null, kilometer_awal || null, kilometer_akhir || null, totalKm, jumlahBbmRupiah, messenger || null, attachment || null, courier_id || null, req.params.id])
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
