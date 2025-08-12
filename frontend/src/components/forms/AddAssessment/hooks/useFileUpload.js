import { useCallback } from 'react'
import { uploadFile } from '../utils/fileHelpers'

/**
 * Custom hook for file upload operations
 */
export const useFileUpload = () => {
  const handleFileUpload = useCallback(async (file, type = '') => {
    try {
      return await uploadFile(file, type)
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }, [])

  const handleMCQImageUpload = useCallback(async (file) => {
    return await handleFileUpload(file, 'MCQ_IMAGE')
  }, [handleFileUpload])

  const handleMCQAudioUpload = useCallback(async (file) => {
    return await handleFileUpload(file, 'MCQ_AUDIO')
  }, [handleFileUpload])

  const handleAssessmentFileUpload = useCallback(async (file) => {
    return await handleFileUpload(file, 'ASSESSMENT_FILE')
  }, [handleFileUpload])

  const handleSupportingFileUpload = useCallback(async (file) => {
    return await handleFileUpload(file, 'SUPPORTING_FILE')
  }, [handleFileUpload])

  return {
    handleFileUpload,
    handleMCQImageUpload,
    handleMCQAudioUpload,
    handleAssessmentFileUpload,
    handleSupportingFileUpload
  }
}
