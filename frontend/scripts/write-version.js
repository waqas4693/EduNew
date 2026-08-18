/**
 * Writes public/version.json on each production build.
 * The frontend compares this to localStorage and hard-reloads when it changes.
 */
const fs = require('fs')
const path = require('path')

const version = {
  version: new Date().toISOString(),
  buildTime: Date.now()
}

const outPath = path.join(__dirname, '..', 'public', 'version.json')
fs.writeFileSync(outPath, JSON.stringify(version, null, 2))
console.log('Wrote', outPath, version.version)
