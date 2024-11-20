import AWS from 'aws-sdk'
import dotenv from 'dotenv'

dotenv.config()

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

export const getS3SignedUrl = async (req, res) => {
  const { fileName, fileType } = req.body
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Expires: 60 * 50,
    ContentType: fileType
  }


  try {
    const signedUrl = await s3.getSignedUrlPromise('putObject', params)
    res.json({ signedUrl })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    res.status(500).json({ error: 'Failed to generate signed URL' })
  }
}

export const getS3SignedUrlGet = async (req, res) => {
  const { fileName, fileType } = req.body
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Expires: 60 * 50,
  }


  try {
    const signedUrl = await s3.getSignedUrlPromise('getObject', params)
    res.json({ signedUrl })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    res.status(500).json({ error: 'Failed to generate signed URL' })
  }
}