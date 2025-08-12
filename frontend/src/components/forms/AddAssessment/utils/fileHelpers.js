import axios from 'axios'
import url from '../../../config/server-url'

/**
 * Utility functions for file handling in assessments
 */

export const truncateFileName = (fileName, maxLength = 5) => {
  if (!fileName) return ''
  const extension = fileName.split('.').pop()
  const name = fileName.split('.').slice(0, -1).join('.')
  if (name.length <= maxLength) return fileName
  return `${name.substring(0, maxLength)}...${extension}`
}

export const uploadFile = async (file, type = '') => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const uploadUrl = type ? `${url}upload/file?type=${type}` : `${url}upload/file`
    
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.status === 200) {
      return response.data.fileName
    }
    throw new Error('File upload failed')
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export const uploadMCQFiles = async (mcqs) => {
  const uploadPromises = mcqs.map(async (mcq, index) => {
    const updatedMcq = { ...mcq }
    
    // Handle MCQ image upload
    if (mcq.imageFile && mcq.imageFile instanceof File) {
      try {
        const fileName = await uploadFile(mcq.imageFile, 'MCQ_IMAGE')
        updatedMcq.imageFile = fileName
      } catch (error) {
        console.error('Error uploading MCQ image:', error)
        throw new Error(`Failed to upload image for MCQ ${index + 1}`)
      }
    }
    
    // Handle MCQ audio upload
    if (mcq.audioFile && mcq.audioFile instanceof File) {
      try {
        const fileName = await uploadFile(mcq.audioFile, 'MCQ_AUDIO')
        updatedMcq.audioFile = fileName
      } catch (error) {
        console.error('Error uploading MCQ audio:', error)
        throw new Error(`Failed to upload audio for MCQ ${index + 1}`)
      }
    }
    
    return updatedMcq
  })

  return Promise.all(uploadPromises)
}

export const getFileDisplayName = (file) => {
  if (!file) return ''
  if (typeof file === 'string') return file
  return file.name || ''
}

export const isFileObject = (file) => {
  return file && typeof file === 'object' && file instanceof File
}
