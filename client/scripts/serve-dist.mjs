import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import handler from 'serve-handler'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')
const port = Number(process.env.PORT) || 3000
const host = '0.0.0.0'

const server = http.createServer(async (request, response) => {
  if (request.url === '/health' || request.url === '/healthz') {
    response.writeHead(200, { 'Content-Type': 'text/plain' })
    response.end('ok')
    return
  }

  await handler(request, response, {
    public: distDir,
    cleanUrls: true,
    rewrites: [{ source: '**', destination: '/index.html' }]
  })
})

server.listen(port, host, () => {
  console.log(`Static client listening on http://${host}:${port}`)
  console.log(`Serving ${distDir}`)
})

server.on('error', (error) => {
  console.error('Failed to start static server:', error)
  process.exit(1)
})
