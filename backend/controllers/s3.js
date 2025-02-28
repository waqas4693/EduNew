import AWS from 'aws-sdk'
import dotenv from 'dotenv'

dotenv.config()

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

// Function to upload file to S3
export const uploadToS3 = async (file, folder, filename) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${folder}/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype
  }

  try {
    const result = await s3.upload(params).promise()
    return filename // Return just the filename to maintain compatibility
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw new Error('Failed to upload file to S3')
  }
}

// Function to get signed URL for viewing/downloading
export const getSignedUrl = async (req, res) => {
  try {
    const { folder, filename } = req.params

    if (!folder || !filename) {
      return res.status(400).json({ 
        error: 'Folder and filename are required' 
      })
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${folder}/${filename}`,
      Expires: 3600 // URL expires in 1 hour
    }

    const signedUrl = await s3.getSignedUrlPromise('getObject', params)
    res.json({ signedUrl })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    res.status(500).json({ error: 'Failed to generate signed URL' })
  }
}

// Function to check if file exists in S3
export const checkFileExists = async (folder, filename) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${folder}/${filename}`
  }

  try {
    await s3.headObject(params).promise()
    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      return false
    }
    throw error
  }
}

// Optional: Function to delete file from S3
export const deleteFromS3 = async (folder, filename) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${folder}/${filename}`
  }

  try {
    await s3.deleteObject(params).promise()
    return true
  } catch (error) {
    console.error('Error deleting from S3:', error)
    throw new Error('Failed to delete file from S3')
  }
}