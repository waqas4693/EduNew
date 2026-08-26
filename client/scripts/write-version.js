/**
<<<<<<< HEAD
 * Writes dist/version.json after production build.
 * DeploymentCacheGuard fetches this to detect new deployments and hard-reload.
=======
 * Writes public/version.json on each production build.
 * The frontend compares this to localStorage and hard-reloads when it changes.
>>>>>>> b4d431ca10dc7f95a42c744858d3507988a39a97
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

<<<<<<< HEAD
const outDir = path.join(__dirname, '..', 'dist')
const outPath = path.join(outDir, 'version.json')

if (!fs.existsSync(outDir)) {
  console.warn('Skipping version.json: dist/ not found. Run vite build first.')
  process.exit(0)
}

=======
const outPath = path.join(__dirname, '..', 'public', 'version.json')
>>>>>>> b4d431ca10dc7f95a42c744858d3507988a39a97
fs.writeFileSync(outPath, JSON.stringify(version, null, 2))
console.log('Wrote', outPath, version.version)
