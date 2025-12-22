import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../db/mysql.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

// Helper function untuk set cookies
const setAuthCookies = (res, access, refresh) => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  res.cookie('access_token', access, {
    httpOnly: true,
    secure: isProduction, // true untuk HTTPS
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 30 * 60 * 1000, // 30 menit
    path: '/'
  })
  
  res.cookie('refresh_token', refresh, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    path: '/'
  })
}

// Helper function untuk clear cookies
const clearAuthCookies = (res) => {
  res.clearCookie('access_token', { path: '/' })
  res.clearCookie('refresh_token', { path: '/' })
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phone, profile_image, vehicle_info } = req.body || {}
    
    // Validasi input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, dan nama wajib diisi' })
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format email tidak valid' })
    }
    
    // Validasi panjang password
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' })
    }
    
    // Cek apakah email sudah terdaftar
    const found = await query('SELECT id FROM users WHERE email = ?', [email])
    if (found.length) {
      return res.status(409).json({ error: 'Email sudah terdaftar' })
    }
    
    // Hash password
    const hash = bcrypt.hashSync(password, 10)
    
    // Insert user baru
    const result = await query(
      'INSERT INTO users (name, email, password, role, status, phone, profile_image, vehicle_info, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        email,
        hash,
        role || 'messenger',
        'active',
        phone || null,
        profile_image || null,
        vehicle_info || null,
        1
      ]
    )
    
    const userId = result.insertId
    
    // Ambil data user yang baru dibuat
    const user = await query(
      'SELECT id, name, email, role, status, phone, profile_image, vehicle_info, is_active FROM users WHERE id = ?',
      [userId]
    )
    
    console.log('User registered:', user[0].email)
    
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { user: user[0] }
    })
  } catch (e) {
    console.error('Register error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    
    // Log untuk debugging
    console.log('Login attempt:', {
      email,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    })
    
    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' })
    }
    
    // Cari user berdasarkan email
    const rows = await query('SELECT * FROM users WHERE email = ?', [email])
    
    if (!rows.length) {
      console.log('Login failed: User not found -', email)
      return res.status(401).json({ error: 'Email atau password salah' })
    }
    
    const user = rows[0]
    
    // Cek status user
    if (user.status === 'inactive' || user.is_active === 0) {
      console.log('Login failed: Inactive user -', email)
      return res.status(401).json({ error: 'Akun tidak aktif' })
    }
    
    // Verifikasi password
    const isPasswordValid = bcrypt.compareSync(password || '', user.password)
    
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password -', email)
      
      // Update login attempts (opsional - untuk keamanan)
      await query(
        'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?',
        [user.id]
      )
      
      return res.status(401).json({ error: 'Email atau password salah' })
    }
    
    // Update last login dan reset login attempts
    await query(
      'UPDATE users SET last_login = NOW(), login_attempts = 0 WHERE id = ?',
      [user.id]
    )
    
    // Generate JWT tokens
    const secret = process.env.JWT_SECRET || 'change_me_to_secure_secret'
    const expiresIn = process.env.JWT_EXPIRES_IN || '30m'
    
    const accessToken = jwt.sign(
      {
        sub: String(user.id),
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn }
    )
    
    const refreshToken = jwt.sign(
      { sub: String(user.id) },
      secret,
      { expiresIn: '7d' }
    )
    
    // Set cookies untuk token
    setAuthCookies(res, accessToken, refreshToken)
    
    console.log('Login successful:', email)
    
    // Response dengan data user dan tokens
    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          profile_image: user.profile_image,
          vehicle_info: user.vehicle_info
        },
        tokens: {
          access: accessToken,
          refresh: refreshToken
        }
      }
    })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name, email, role, status, phone, profile_image, vehicle_info, is_active FROM users WHERE id = ?',
      [req.user.sub]
    )
    
    if (!rows.length) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }
    
    res.json({
      success: true,
      data: rows[0]
    })
  } catch (e) {
    console.error('Get profile error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, profile_image, vehicle_info, status, is_active, email } = req.body || {}
    const userId = req.user.sub
    const currentRows = await query('SELECT email FROM users WHERE id = ?', [userId])
    const currentEmail = currentRows.length ? String(currentRows[0].email || '') : ''

    // Jika user ingin mengganti email, validasi format dan cek duplikasi
    if (email) {
      const emailStr = String(email).trim()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(emailStr)) {
        return res.status(400).json({ error: 'Format email tidak valid' })
      }
      const exists = await query(
        'SELECT id FROM users WHERE email = ? AND id <> ?',
        [emailStr, req.user.sub]
      )
      if (exists.length) {
        return res.status(409).json({ error: 'Email sudah digunakan' })
      }
      await query('UPDATE users SET email = ? WHERE id = ?', [emailStr, userId])
    }

    await query(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), profile_image = COALESCE(?, profile_image), vehicle_info = COALESCE(?, vehicle_info), status = COALESCE(?, status), is_active = COALESCE(?, is_active) WHERE id = ?',
      [
        (typeof name === 'string' ? name.trim() : null) || null,
        phone || null,
        profile_image || null,
        vehicle_info || null,
        status || null,
        typeof is_active === 'number' ? is_active : null,
        userId
      ]
    )

    const rowsAfter = await query(
      'SELECT id, name, email, role, status, phone, profile_image, vehicle_info, is_active FROM users WHERE id = ?',
      [userId]
    )

    const nextUser = rowsAfter[0]
    const requestedEmail = typeof email === 'string' ? email.trim() : null

    res.json({
      success: true,
      message: 'Profile berhasil diupdate',
      data: nextUser
    })
  } catch (e) {
    console.error('Update profile error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { current, next } = req.body || {}
    
    if (!current || !next) {
      return res.status(400).json({ error: 'Password lama dan baru wajib diisi' })
    }
    
    if (next.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' })
    }
    
    const rows = await query('SELECT password FROM users WHERE id = ?', [req.user.sub])
    
    if (!rows.length) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }
    
    const isPasswordValid = bcrypt.compareSync(current || '', rows[0].password)
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Password lama salah' })
    }
    
    const hash = bcrypt.hashSync(next, 10)
    await query(
      'UPDATE users SET password = ?, last_password_change = NOW() WHERE id = ?',
      [hash, req.user.sub]
    )
    
    res.json({
      success: true,
      message: 'Password berhasil diubah'
    })
  } catch (e) {
    console.error('Change password error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Clear cookies
    clearAuthCookies(res)
    
    console.log('User logged out:', req.user.email)
    
    res.json({
      success: true,
      message: 'Logout berhasil'
    })
  } catch (e) {
    console.error('Logout error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    // Ambil refresh token dari cookie atau body
    const refreshToken = req.cookies?.refresh_token || req.body?.refresh_token
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token tidak ditemukan' })
    }
    
    const secret = process.env.JWT_SECRET || 'change_me_to_secure_secret'
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, secret)
    
    // Generate new access token
    const expiresIn = process.env.JWT_EXPIRES_IN || '30m'
    const newAccessToken = jwt.sign(
      { sub: decoded.sub },
      secret,
      { expiresIn }
    )
    
    // Set cookie untuk access token baru
    const isProduction = process.env.NODE_ENV === 'production'
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 60 * 1000,
      path: '/'
    })
    
    res.json({
      success: true,
      data: {
        access_token: newAccessToken
      }
    })
  } catch (e) {
    console.error('Refresh token error:', e)
    res.status(401).json({ error: 'Refresh token tidak valid' })
  }
})

// ADMIN ROUTES

router.post('/admin/create-user', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role, phone } = req.body || {}
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, dan nama wajib diisi' })
    }
    
    const allowedRoles = ['admin', 'messenger']
    const userRole = allowedRoles.includes(String(role)) ? String(role) : 'messenger'
    
    const found = await query('SELECT id FROM users WHERE email = ?', [email])
    if (found.length) {
      return res.status(409).json({ error: 'Email sudah terdaftar' })
    }
    
    const hash = bcrypt.hashSync(password, 10)
    const result = await query(
      'INSERT INTO users (name, email, password, role, status, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hash, userRole, 'active', phone || null, 1]
    )
    
    const userId = result.insertId
    const user = await query(
      'SELECT id, name, email, role, status, phone, is_active FROM users WHERE id = ?',
      [userId]
    )
    
    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: { user: user[0] }
    })
  } catch (e) {
    console.error('Admin create user error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name, email, role, status, phone, is_active, created_at, updated_at FROM users ORDER BY id DESC'
    )
    
    res.json({
      success: true,
      data: rows
    })
  } catch (e) {
    console.error('Admin get users error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.get('/messengers', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, name FROM users WHERE role = "messenger" AND is_active = 1 ORDER BY name ASC'
    )
    
    res.json({
      success: true,
      data: rows
    })
  } catch (e) {
    console.error('Get messengers error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.put('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id)
    
    if (!userId) {
      return res.status(400).json({ error: 'ID user tidak valid' })
    }
    
    const allowedRoles = ['admin', 'messenger']
    const { name, phone, role, status, is_active, email } = req.body || {}
    
    const roleValue = allowedRoles.includes(String(role)) ? String(role) : null
    const isActiveValue = typeof is_active === 'number' ? is_active : (typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null)
    
    // Cek apakah email sudah digunakan user lain
    if (email) {
      const exists = await query(
        'SELECT id FROM users WHERE email = ? AND id <> ?',
        [email, userId]
      )
      if (exists.length) {
        return res.status(409).json({ error: 'Email sudah digunakan' })
      }
    }
    
    await query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), role = COALESCE(?, role), status = COALESCE(?, status), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name || null, email || null, phone || null, roleValue, status || null, isActiveValue, userId]
    )
    
    const rows = await query(
      'SELECT id, name, email, role, status, phone, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )
    
    res.json({
      success: true,
      message: 'User berhasil diupdate',
      data: rows[0]
    })
  } catch (e) {
    console.error('Admin update user error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.post('/admin/users/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id)
    const { password } = req.body || {}
    
    if (!userId || !password) {
      return res.status(400).json({ error: 'ID user dan password wajib diisi' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' })
    }
    
    const hash = bcrypt.hashSync(password, 10)
    await query(
      'UPDATE users SET password = ?, last_password_change = NOW() WHERE id = ?',
      [hash, userId]
    )
    
    res.json({
      success: true,
      message: 'Password berhasil direset'
    })
  } catch (e) {
    console.error('Admin reset password error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id)
    
    if (!userId) {
      return res.status(400).json({ error: 'ID user tidak valid' })
    }
    
    // Cegah admin menghapus diri sendiri
    if (String(req.user.sub) === String(userId)) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' })
    }
    
    const rows = await query('SELECT id FROM users WHERE id = ?', [userId])
    if (!rows.length) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }
    
    await query('DELETE FROM users WHERE id = ?', [userId])
    
    res.json({
      success: true,
      message: 'User berhasil dihapus'
    })
  } catch (e) {
    console.error('Admin delete user error:', e)
    res.status(500).json({ error: 'Terjadi kesalahan server' })
  }
})

export default router
