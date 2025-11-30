import jwt from 'jsonwebtoken'

// Middleware untuk autentikasi
export const requireAuth = (req, res, next) => {
  try {
    // Ambil token dari cookie atau header Authorization
    let token = req.cookies?.access_token
    
    // Jika tidak ada di cookie, coba dari header
    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7) // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token tidak ditemukan' 
      })
    }
    
    // Verify token
    const secret = process.env.JWT_SECRET || 'change_me_to_secure_secret'
    const decoded = jwt.verify(token, secret)
    
    // Attach user info ke request
    req.user = decoded
    
    next()
  } catch (e) {
    console.error('Auth middleware error:', e.message)
    
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'TokenExpired',
        message: 'Token sudah kadaluarsa' 
      })
    }
    
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'InvalidToken',
        message: 'Token tidak valid' 
      })
    }
    
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Autentikasi gagal' 
    })
  }
}

// Middleware untuk cek role admin
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User tidak terautentikasi' 
      })
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Hanya admin yang dapat mengakses' 
      })
    }
    
    next()
  } catch (e) {
    console.error('Admin middleware error:', e.message)
    return res.status(500).json({ 
      error: 'ServerError',
      message: 'Terjadi kesalahan server' 
    })
  }
}

// Middleware untuk cek role messenger
export const requireMessenger = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User tidak terautentikasi' 
      })
    }
    
    if (req.user.role !== 'messenger' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Hanya messenger atau admin yang dapat mengakses' 
      })
    }
    
    next()
  } catch (e) {
    console.error('Messenger middleware error:', e.message)
    return res.status(500).json({ 
      error: 'ServerError',
      message: 'Terjadi kesalahan server' 
    })
  }
}