import { uploadFile } from '../utils/fileUpload.js'

export const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileName = await uploadFile(
      req.file,
      'THUMBNAILS',
      req.file.originalname
    )

    res.status(200).json({
      success: true,
      fileName: fileName
    })
  } catch (error) {
    console.error('Error uploading thumbnail:', error)
    res.status(500).json({ message: 'Error uploading thumbnail' })
  }
} 