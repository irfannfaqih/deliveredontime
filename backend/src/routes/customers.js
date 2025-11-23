import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { query } from '../db/mysql.js'
import { mapCustomerRow } from '../lib/case.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM customers ORDER BY id DESC')
    res.json({ data: rows.map(mapCustomerRow) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM customers WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ data: mapCustomerRow(rows[0]) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { namaCustomer, noHp, alamat, google_maps, image } = req.body || {}
    if (!namaCustomer) return res.status(400).json({ error: 'Invalid' })
    const r = await query('INSERT INTO customers (nama_customer,no_hp,alamat,google_maps,image) VALUES (?,?,?,?,?)', [namaCustomer, noHp || null, alamat || null, google_maps || null, image || null])
    const id = r.insertId
    const rows = await query('SELECT * FROM customers WHERE id = ?', [id])
    res.json({ data: mapCustomerRow(rows[0]) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { namaCustomer, noHp, alamat, google_maps, image } = req.body || {}
    await query('UPDATE customers SET nama_customer=COALESCE(?,nama_customer), no_hp=COALESCE(?,no_hp), alamat=COALESCE(?,alamat), google_maps=COALESCE(?,google_maps), image=COALESCE(?,image) WHERE id = ?', [namaCustomer || null, noHp || null, alamat || null, google_maps || null, image || null, req.params.id])
    const rows = await query('SELECT * FROM customers WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ data: mapCustomerRow(rows[0]) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM customers WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    await query('DELETE FROM customers WHERE id = ?', [req.params.id])
    res.json({ data: mapCustomerRow(rows[0]) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

export default router