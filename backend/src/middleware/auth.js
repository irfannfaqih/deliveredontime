import jwt from 'jsonwebtoken'

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const secret = process.env.JWT_SECRET || 'change_me'
    const payload = jwt.verify(token, secret)
    req.user = payload
    next()
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' })
  }
}