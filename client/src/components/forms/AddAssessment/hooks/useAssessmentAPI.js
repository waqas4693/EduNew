import { useState, useEffect, useCallback } from 'react'
import { getData, postFormData } from '../../../../api/api'
import { prepareAssessmentData } from '../utils/assessmentHelpers'

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
      const submitFormData = new FormData()

      Object.keys(assessmentData).forEach((key) => {
        if (formData.assessmentType === 'MCQ' && ['assessor', 'moderator', 'verifier'].includes(key)) {
          return
        }

        if (key === 'content') {
          const contentCopy = { ...assessmentData.content }

          if (formData.assessmentType === 'MCQ' && contentCopy.mcqs) {
            contentCopy.mcqs = contentCopy.mcqs.map((mcq, index) => {
              const mcqCopy = { ...mcq }

              if (mcq.imageFile && mcq.imageFile instanceof File) {
                submitFormData.append(`mcqImage_${index}`, mcq.imageFile)
                delete mcqCopy.imageFile
              }

              if (mcq.audioFile && mcq.audioFile instanceof File) {
                submitFormData.append(`mcqAudio_${index}`, mcq.audioFile)
                delete mcqCopy.audioFile
              }

              return mcqCopy
            })
          }

          if (formData.assessmentType === 'FILE') {
            if (contentCopy.assessmentFile instanceof File) {
              submitFormData.append('assessmentFile', contentCopy.assessmentFile)
              delete contentCopy.assessmentFile
            }

            if (contentCopy.supportingFile instanceof File) {
              submitFormData.append('supportingFile', contentCopy.supportingFile)
              delete contentCopy.supportingFile
            }
          }

          submitFormData.append('content', JSON.stringify(contentCopy))
        } else {
          submitFormData.append(key, assessmentData[key])
        }
      })

      const response = await postFormData('assessments', submitFormData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
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
        message: error.data?.message || error.message || 'Error creating assessment'
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
