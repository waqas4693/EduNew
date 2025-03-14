import { uploadToS3 } from './s3.js'

export const uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileName = await uploadToS3(
      req.file,
      'THUMBNAILS',
      `${Date.now()}-${req.file.originalname}`
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

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Check if it's a submission or regular file
    const fileType = req.query.type || 'ASSESSMENT_FILES'
    let folderName

    switch (fileType) {
      case 'SUBMISSION':
        folderName = 'ASSESSMENT_SUBMISSIONS'
        break
      case 'ASSESSMENT':
        folderName = 'ASSESSMENT_FILES'
        break
      default:
        folderName = 'ASSESSMENT_FILES'
    }

    const fileName = await uploadToS3(
      req.file,
      folderName,
      `${Date.now()}-${req.file.originalname}`
    )

    res.status(200).json({
      success: true,
      fileName: fileName
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ message: 'Error uploading file' })
  }
} 