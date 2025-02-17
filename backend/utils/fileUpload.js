import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const uploadFile = (file, resourceType, fileName) => {
  const baseDir = path.join(__dirname, '..', 'ResourceFiles')
  const resourceTypeDir = path.join(baseDir, resourceType)

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir)
  }

  if (!fs.existsSync(resourceTypeDir)) {
    fs.mkdirSync(resourceTypeDir)
  }

  const filePath = path.join(resourceTypeDir, fileName)
  fs.writeFileSync(filePath, file.buffer)

  return fileName
} 