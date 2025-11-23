import { Router } from 'express'
import system from './system.js'
import auth from './auth.js'
import customers from './customers.js'
import delivered from './delivered.js'
import bbm from './bbm.js'
import reports from './reports.js'
import files from './files.js'
import upload from './upload.js'

const router = Router()

router.use('/', system)
router.use('/auth', auth)
router.use('/customers', customers)
router.use('/delivered', delivered)
router.use('/deliveries', delivered)
router.use('/bbm', bbm)
router.use('/reports', reports)
router.use('/files', files)
router.use('/upload', upload)

export default router