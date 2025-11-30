import http from 'http'
import { ensureSchema } from './db/mysql.js'
import app from './server.js'

const start = async () => {
  await ensureSchema()
  const port = process.env.PORT || 3000
  app.set('port', port)
  const server = http.createServer(app)
  server.listen(port, () => {
    console.log(`API running on http://localhost:${port}/api`)
  })
}

start()