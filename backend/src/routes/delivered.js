import { Router } from 'express'
import { query } from '../db/mysql.js'
import { mapDeliveryRow } from '../lib/case.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const computeStatus = (sentDate, deliveredDate) => {
  try {
    if (!sentDate || !deliveredDate) return 'Pending'
    const sent = new Date(sentDate)
    const received = new Date(deliveredDate) // tanggal diterima dari admin sales
    const msDiff = sent.getTime() - received.getTime()
    const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24))
    return daysDiff > 2 ? 'Out of time' : 'On time'
  } catch {
    return 'Pending'
  }
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const { date, messenger } = req.query || {}
    let sql = 'SELECT * FROM deliveries'
    const params = []
    const clauses = []

    if (date) { clauses.push('sent_date = ?'); params.push(date) }
    if (messenger) { clauses.push('LOWER(messenger) = LOWER(?)'); params.push(messenger) }

    if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ')
    sql += ' ORDER BY id DESC'

    const rows = await query(sql, params)
    res.json({ data: rows.map(mapDeliveryRow) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

// Place stats route BEFORE parameterized /:id to avoid shadowing
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const totalRows = await query('SELECT COUNT(*) as c FROM deliveries')
    const onRows = await query("SELECT COUNT(*) as c FROM deliveries WHERE LOWER(status) LIKE 'on time%'")
    res.json({ data: { total: totalRows[0].c, ontime: onRows[0].c } })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM deliveries WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ data: mapDeliveryRow(rows[0]) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const { invoice, customer, customer_id, item, sentDate, deliveredDate, messenger, recipient, notes, status, courier_id, bbm_record_id, actualDeliveryDate, created_by } = req.body || {}
    if (!invoice || !item || !sentDate || !messenger) return res.status(400).json({ error: 'Invalid' })
    const derivedStatus = status || computeStatus(sentDate, deliveredDate)
    const r = await query('INSERT INTO deliveries (customer,customer_id,invoice,item,sent_date,delivered_date,messenger,recipient,notes,status,courier_id,bbm_record_id,actual_delivery_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [customer || null, customer_id || null, invoice, item, sentDate, deliveredDate || null, messenger, recipient || null, notes || null, derivedStatus, courier_id || null, bbm_record_id || null, actualDeliveryDate || null, created_by || null])
    const id = r.insertId
    const rows = await query('SELECT * FROM deliveries WHERE id = ?', [id])
    res.json({ data: mapDeliveryRow(rows[0]) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { invoice, customer, customer_id, item, sentDate, deliveredDate, messenger, recipient, notes, status, courier_id, bbm_record_id, actualDeliveryDate } = req.body || {}
    const derivedStatus = status || computeStatus(sentDate, deliveredDate)
    await query('UPDATE deliveries SET customer=COALESCE(?,customer), customer_id=COALESCE(?,customer_id), invoice=COALESCE(?,invoice), item=COALESCE(?,item), sent_date=COALESCE(?,sent_date), delivered_date=COALESCE(?,delivered_date), messenger=COALESCE(?,messenger), recipient=COALESCE(?,recipient), notes=COALESCE(?,notes), status=COALESCE(?,status), courier_id=COALESCE(?,courier_id), bbm_record_id=COALESCE(?,bbm_record_id), actual_delivery_date=COALESCE(?,actual_delivery_date) WHERE id = ?', [customer || null, customer_id || null, invoice || null, item || null, sentDate || null, deliveredDate || null, messenger || null, recipient || null, notes || null, derivedStatus || null, courier_id || null, bbm_record_id || null, actualDeliveryDate || null, req.params.id])
    const rows = await query('SELECT * FROM deliveries WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ data: mapDeliveryRow(rows[0]) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM deliveries WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    await query('DELETE FROM deliveries WHERE id = ?', [req.params.id])
    res.json({ data: mapDeliveryRow(rows[0]) })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})


export default router
