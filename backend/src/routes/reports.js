import { Router } from 'express'
import { query } from '../db/mysql.js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()
const ensureDir = d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }) }
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'backend/uploads')
ensureDir(uploadDir)

const router = Router()

router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM reports ORDER BY id DESC')
    res.json({ data: rows })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.post('/generate', async (req, res) => {
  try {
    const { title, report_type, date_from, date_to, messenger_name, file_type } = req.body || {}
    if (!title || !report_type) return res.status(400).json({ error: 'Invalid' })
    const r = await query('INSERT INTO reports (title,report_type,date_from,date_to,messenger_name,report_data,file_path,file_type,generated_by,status) VALUES (?,?,?,?,?,?,?,?,?,?)', [title, report_type, date_from || null, date_to || null, messenger_name || null, JSON.stringify({}), null, file_type || 'csv', 0, 'generating'])
    const id = r.insertId

    const deliveriesParams = []
    let deliveriesSql = 'SELECT sent_date as date, COUNT(*) as invoice_count FROM deliveries WHERE 1=1'
    if (date_from && date_to) { deliveriesSql += ' AND sent_date BETWEEN ? AND ?'; deliveriesParams.push(date_from, date_to) }
    if (messenger_name) { deliveriesSql += ' AND messenger = ?'; deliveriesParams.push(messenger_name) }
    deliveriesSql += ' GROUP BY sent_date ORDER BY sent_date ASC'
    const deliveries = await query(deliveriesSql, deliveriesParams)

    const bbmParams = []
    let bbmSql = 'SELECT tanggal as date, MIN(kilometer_awal) as km_awal, MAX(kilometer_akhir) as km_akhir FROM bbm_records WHERE 1=1'
    if (date_from && date_to) { bbmSql += ' AND tanggal BETWEEN ? AND ?'; bbmParams.push(date_from, date_to) }
    if (messenger_name) { bbmSql += ' AND messenger = ?'; bbmParams.push(messenger_name) }
    bbmSql += ' GROUP BY tanggal ORDER BY tanggal ASC'
    const bbm = await query(bbmSql, bbmParams)

    const byDate = new Map()
    for (const d of deliveries) {
      const key = String(d.date).slice(0,10)
      const cur = byDate.get(key) || { date: key, invoice_count: 0, km_awal: null, km_akhir: null, total_km: null }
      cur.invoice_count = (cur.invoice_count || 0) + Number(d.invoice_count || 0)
      byDate.set(key, cur)
    }
    for (const b of bbm) {
      const key = String(b.date).slice(0,10)
      const cur = byDate.get(key) || { date: key, invoice_count: 0, km_awal: null, km_akhir: null, total_km: null }
      const awal = b.km_awal != null ? Number(b.km_awal) : null
      const akhir = b.km_akhir != null ? Number(b.km_akhir) : null
      cur.km_awal = awal == null ? cur.km_awal : (cur.km_awal == null ? awal : Math.min(cur.km_awal, awal))
      cur.km_akhir = akhir == null ? cur.km_akhir : (cur.km_akhir == null ? akhir : Math.max(cur.km_akhir, akhir))
      if (cur.km_awal != null && cur.km_akhir != null) cur.total_km = cur.km_akhir - cur.km_awal
      byDate.set(key, cur)
    }
    const rows = Array.from(byDate.values()).sort((a,b) => a.date.localeCompare(b.date))

    const header = ['Tanggal','Invoice','KM Awal','KM Akhir','Total KM']
    const csv = [header.join(','), ...rows.map(r => [r.date, r.invoice_count ?? '', r.km_awal ?? '', r.km_akhir ?? '', r.total_km ?? ''].join(','))].join('\n')
    const stored = `${Date.now()}-daily-summary.csv`
    const filePath = path.join(uploadDir, stored)
    fs.writeFileSync(filePath, csv)

    await query('UPDATE reports SET report_data=?, file_path=?, file_type=?, status=? WHERE id=?', [JSON.stringify({ rows }), filePath, 'csv', 'ready', id])
    const out = await query('SELECT * FROM reports WHERE id = ?', [id])
    res.json({ data: out[0] })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.get('/daily-summary', async (req, res) => {
  try {
    const { date } = req.query || {}
    if (!date) return res.status(400).json({ error: 'Invalid date' })
    const rows = await query('SELECT * FROM daily_reports WHERE date = ?', [date])
    if (rows.length) return res.json({ data: rows[0] })
    // Fallback: compute from deliveries and bbm_records if no record exists
    const inv = await query('SELECT COUNT(*) as c FROM deliveries WHERE sent_date = ?', [date])
    const km = await query('SELECT MIN(CAST(kilometer_awal as UNSIGNED)) as km_awal, MAX(CAST(kilometer_akhir as UNSIGNED)) as km_akhir FROM bbm_records WHERE tanggal = ?', [date])
    const total_km = km[0].km_awal != null && km[0].km_akhir != null ? (km[0].km_akhir - km[0].km_awal) : null
    res.json({ data: { date, invoice_count: inv[0].c, km_awal: km[0].km_awal, km_akhir: km[0].km_akhir, total_km: total_km } })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.get('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    const safe = path.basename(filename)
    const filePath = path.join(uploadDir, safe)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' })
    res.sendFile(filePath)
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

export default router