/**
 * Writes dist/version.json after production build.
 * DeploymentCacheGuard fetches this to detect new deployments and hard-reload.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = {
  version: new Date().toISOString(),
  buildTime: Date.now()
}

const outDir = path.join(__dirname, '..', 'dist')
const outPath = path.join(outDir, 'version.json')

if (!fs.existsSync(outDir)) {
  console.warn('Skipping version.json: dist/ not found. Run vite build first.')
  process.exit(0)
}

fs.writeFileSync(outPath, JSON.stringify(version, null, 2))
console.log('Wrote', outPath, version.version)
