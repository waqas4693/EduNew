import { useState, useEffect, useCallback } from 'react'
import { getData } from '../../../../api/api'
import axios from 'axios'
import url from '../../../config/server-url'

import { prepareAssessmentData } from '../utils/assessmentHelpers'

/**
 * Custom hook for handling assessment-related API operations
 */
export const useAssessmentAPI = () => {
  const [assessors, setAssessors] = useState([])
  const [moderators, setModerators] = useState([])
  const [verifiers, setVerifiers] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getData('users/assessment-users')
      if (response.status === 200) {
        const { assessors, moderators, verifiers } = response.data.data
        setAssessors(assessors)
        setModerators(moderators)
        setVerifiers(verifiers)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const submitAssessment = useCallback(async (formData, courseId, unitId, sectionId) => {
    try {
      setUploadProgress(0)
      const assessmentData = prepareAssessmentData(formData, courseId, unitId, sectionId)
      
      // Create FormData for file uploads
      const submitFormData = new FormData()
      
      // Add all assessment fields to FormData
      Object.keys(assessmentData).forEach(key => {
        if (key === 'content') {
          // Handle content separately to process files
          const contentCopy = { ...assessmentData.content }
          
          // If MCQ type, process MCQ files
          if (formData.assessmentType === 'MCQ' && contentCopy.mcqs) {
            contentCopy.mcqs = contentCopy.mcqs.map((mcq, index) => {
              const mcqCopy = { ...mcq }
              
              // Add MCQ image file to FormData if it's a File object
              if (mcq.imageFile && mcq.imageFile instanceof File) {
                submitFormData.append(`mcqImage_${index}`, mcq.imageFile)
                // Remove the file object from content, backend will set the filename
                delete mcqCopy.imageFile
              }
              
              // Add MCQ audio file to FormData if it's a File object
              if (mcq.audioFile && mcq.audioFile instanceof File) {
                submitFormData.append(`mcqAudio_${index}`, mcq.audioFile)
                // Remove the file object from content, backend will set the filename
                delete mcqCopy.audioFile
              }
              
              return mcqCopy
            })
          }
          
          submitFormData.append('content', JSON.stringify(contentCopy))
        } else {
          submitFormData.append(key, assessmentData[key])
        }
      })
      
      // Submit the assessment with FormData and progress tracking
      const response = await axios.post(`${url}assessments`, submitFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        }
      })
      
      if (response.status === 201) {
        return {
          success: true,
          message: 'Assessment created successfully!'
        }
      }
      
      throw new Error('Unexpected response status')
    } catch (error) {
      console.error('Error creating assessment:', error)
      setUploadProgress(0)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error creating assessment'
      }
    }
  }, [])

  return {
    assessors,
    moderators,
    verifiers,
    submitAssessment,
    fetchUsers,
    uploadProgress
  }
}
