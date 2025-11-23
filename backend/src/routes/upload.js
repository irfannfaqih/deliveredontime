import { Router } from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { query } from '../db/mysql.js'
import { requireAuth } from '../middleware/auth.js'

const ensureDir = d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
}

const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'backend/uploads')
ensureDir(uploadDir)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer destination called');
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    console.log('Multer filename called for:', file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter called:', file.mimetype);
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
})

const router = Router()

// Tambahkan logging sebelum multer
router.post('/', (req, res, next) => {
  console.log('=== UPLOAD REQUEST RECEIVED ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Headers:', req.headers);
  next();
}, requireAuth, upload.single('file'), async (req, res) => {
  console.log('=== AFTER MULTER & AUTH ===');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  console.log('req.user:', req.user);
  
  try {
    if (!req.file) {
      console.error('ERROR: No file in request after multer');
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const category = req.body.category || 'document'
    const original = req.file.originalname
    const stored = req.file.filename
    const filePath = req.file.path
    const size = String(req.file.size)
    const mime = req.file.mimetype
    const uploadedBy = req.user?.sub ? Number(req.user.sub) : null

    console.log('Processing category:', category);
    console.log('User ID:', uploadedBy);

    if (category === 'profile_image') {
      const userId = uploadedBy
      
      if (!userId) {
        console.error('ERROR: No user ID found');
        return res.status(400).json({ error: 'Invalid user - not authenticated' })
      }

      const publicUrl = `/uploads/${stored}`
      
      console.log('Updating user profile_image to:', publicUrl);
      
      try {
        await query('UPDATE users SET profile_image=? WHERE id=?', [publicUrl, userId])
        console.log('SUCCESS: Database updated');
        
        return res.json({ 
          success: true,
          data: { 
            url: publicUrl, 
            file: { 
              original_filename: original, 
              stored_filename: stored, 
              file_path: filePath, 
              file_size: size, 
              mime_type: mime 
            } 
          } 
        })
      } catch (dbError) {
        console.error('Database error:', dbError)
        return res.status(500).json({ error: `Database error: ${dbError.message}` })
      }
    }

    // Handle other categories...
    if (category === 'delivery_proof') {
      const deliveryId = Number(req.body.delivery_id)
      if (!deliveryId) return res.status(400).json({ error: 'Invalid delivery_id' })
      const r = await query('INSERT INTO attachments (delivery_id,original_filename,stored_filename,file_path,file_size,mime_type,uploaded_by,upload_purpose) VALUES (?,?,?,?,?,?,?,?)', [deliveryId, original, stored, filePath, size, mime, uploadedBy || 0, 'delivery_proof'])
      const id = r.insertId
      const rows = await query('SELECT * FROM attachments WHERE id=?', [id])
      return res.json({ data: rows[0] })
    }

    if (category === 'bbm_proof') {
      const bbmId = Number(req.body.bbm_record_id)
      if (!bbmId) return res.status(400).json({ error: 'Invalid bbm_record_id' })
      const r = await query('INSERT INTO bbm_attachments (bbm_record_id,original_filename,stored_filename,file_path,file_size,mime_type,uploaded_by) VALUES (?,?,?,?,?,?,?)', [bbmId, original, stored, filePath, size, mime, uploadedBy || 0])
      const id = r.insertId
      const rows = await query('SELECT * FROM bbm_attachments WHERE id=?', [id])
      return res.json({ data: rows[0] })
    }

    if (category === 'customer_proof') {
      const customerId = Number(req.body.customer_id)
      if (!customerId) return res.status(400).json({ error: 'Invalid customer_id' })
      const r = await query('INSERT INTO customer_attachments (customer_id,original_filename,stored_filename,file_path,file_size,mime_type,uploaded_by) VALUES (?,?,?,?,?,?,?)', [customerId, original, stored, filePath, size, mime, uploadedBy || 0])
      const id = r.insertId
      const rows = await query('SELECT * FROM customer_attachments WHERE id=?', [id])
      return res.json({ data: rows[0] })
    }

    console.error('ERROR: Invalid category:', category)
    res.status(400).json({ error: 'Invalid category' })
  } catch (e) {
    console.error('Upload route error:', e)
    console.error('Error stack:', e.stack)
    res.status(500).json({ error: String(e.message || e) })
  }
})

export default router
