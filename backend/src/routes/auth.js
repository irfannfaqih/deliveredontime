import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db/mysql.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phone, profile_image, vehicle_info } = req.body || {}
    if (!email || !password || !name) return res.status(400).json({ error: 'Invalid' })
    const found = await query('SELECT id FROM users WHERE email = ?', [email])
    if (found.length) return res.status(409).json({ error: 'Exists' })
    const hash = bcrypt.hashSync(password, 10)
    const r = await query('INSERT INTO users (name,email,password,role,status,phone,profile_image,vehicle_info,is_active) VALUES (?,?,?,?,?,?,?,?,?)', [name, email, hash, role || 'messenger', 'active', phone || null, profile_image || null, vehicle_info || null, 1])
    const id = r.insertId
    const user = await query('SELECT id,name,email,role,status,phone,profile_image,vehicle_info,is_active FROM users WHERE id=?', [id])
    res.json({ data: { user: user[0] } })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const rows = await query('SELECT * FROM users WHERE email = ?', [email])
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' })
    const user = rows[0]
    if (user.status === 'inactive' || user.is_active === 0) return res.status(401).json({ error: 'Inactive' })
    const ok = bcrypt.compareSync(password || '', user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    await query('UPDATE users SET last_login = NOW(), login_attempts = 0 WHERE id = ?', [user.id])
    const secret = process.env.JWT_SECRET || 'change_me'
    const access = jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '30m' })
    const refresh = jwt.sign({ sub: String(user.id) }, secret, { expiresIn: '7d' })
    res.json({ data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, tokens: { access, refresh } } })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.get('/profile', requireAuth, async (req, res) => {
  const rows = await query('SELECT id,name,email,role,status,phone,profile_image,vehicle_info,is_active FROM users WHERE id = ?', [req.user.sub])
  if (!rows.length) return res.status(404).json({ error: 'Not found' })
  res.json({ data: rows[0] })
})

router.put('/profile', requireAuth, async (req, res) => {
  const { name, phone, profile_image, vehicle_info, status, is_active } = req.body || {}
  await query('UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), profile_image=COALESCE(?,profile_image), vehicle_info=COALESCE(?,vehicle_info), status=COALESCE(?,status), is_active=COALESCE(?,is_active) WHERE id = ?', [name || null, phone || null, profile_image || null, vehicle_info || null, status || null, typeof is_active === 'number' ? is_active : null, req.user.sub])
  const rows = await query('SELECT id,name,email,role,status,phone,profile_image,vehicle_info,is_active FROM users WHERE id = ?', [req.user.sub])
  res.json({ data: rows[0] })
})

router.post('/change-password', requireAuth, async (req, res) => {
  const { current, next } = req.body || {}
  const rows = await query('SELECT password FROM users WHERE id = ?', [req.user.sub])
  if (!rows.length) return res.status(404).json({ error: 'Not found' })
  const ok = bcrypt.compareSync(current || '', rows[0].password)
  if (!ok) return res.status(400).json({ error: 'Invalid password' })
  const hash = bcrypt.hashSync(next || '', 10)
  await query('UPDATE users SET password=?, last_password_change=NOW() WHERE id=?', [hash, req.user.sub])
  res.json({ data: true })
})

router.post('/logout', requireAuth, async (req, res) => {
  res.json({ data: true })
})

router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body || {}
  if (!refresh_token) return res.status(400).json({ error: 'Invalid' })
  try {
    const secret = process.env.JWT_SECRET || 'change_me'
    const decoded = jwt.verify(refresh_token, secret)
    const access = jwt.sign({ sub: decoded.sub }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '30m' })
    res.json({ data: { access_token: access } })
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' })
  }
})

export default router

router.post('/admin/create-user', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body || {}
    if (!email || !password || !name) return res.status(400).json({ error: 'Invalid' })
    const allowed = ['admin', 'messenger']
    const rrole = allowed.includes(String(role)) ? String(role) : 'messenger'
    const found = await query('SELECT id FROM users WHERE email = ?', [email])
    if (found.length) return res.status(409).json({ error: 'Exists' })
    const hash = bcrypt.hashSync(password, 10)
    const r = await query('INSERT INTO users (name,email,password,role,status,phone,is_active) VALUES (?,?,?,?,?,?,?)', [name, email, hash, rrole, 'active', phone || null, 1])
    const id = r.insertId
    const user = await query('SELECT id,name,email,role,status,phone,is_active FROM users WHERE id=?', [id])
    res.json({ data: { user: user[0] } })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await query('SELECT id,name,email,role,status,phone,is_active,created_at,updated_at FROM users ORDER BY id DESC')
    res.json({ data: rows })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

// List messenger users (accessible to any authenticated role)
router.get('/messengers', requireAuth, async (req, res) => {
  try {
    const rows = await query('SELECT id,name FROM users WHERE role="messenger" AND is_active=1 ORDER BY name ASC')
    res.json({ data: rows })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.put('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid user id' })
    const allowedRoles = ['admin', 'messenger']
    const { name, phone, role, status, is_active, email } = req.body || {}
    const roleVal = allowedRoles.includes(String(role)) ? String(role) : null
    const isActiveVal = typeof is_active === 'number' ? is_active : (typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null)
    if (email) {
      const exists = await query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, id])
      if (exists.length) return res.status(409).json({ error: 'Email exists' })
    }
    await query('UPDATE users SET name=COALESCE(?,name), email=COALESCE(?,email), phone=COALESCE(?,phone), role=COALESCE(?,role), status=COALESCE(?,status), is_active=COALESCE(?,is_active) WHERE id=?', [name || null, email || null, phone || null, roleVal, status || null, isActiveVal, id])
    const rows = await query('SELECT id,name,email,role,status,phone,is_active,created_at,updated_at FROM users WHERE id=?', [id])
    res.json({ data: rows[0] })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.post('/admin/users/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { password } = req.body || {}
    if (!id || !password) return res.status(400).json({ error: 'Invalid' })
    const hash = bcrypt.hashSync(password, 10)
    await query('UPDATE users SET password=?, last_password_change=NOW() WHERE id=?', [hash, id])
    res.json({ data: true })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})

router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid user id' })
    if (String(req.user.sub) === String(id)) return res.status(400).json({ error: 'Cannot delete self' })
    const rows = await query('SELECT id FROM users WHERE id=?', [id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    await query('DELETE FROM users WHERE id=?', [id])
    res.json({ data: true })
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) })
  }
})