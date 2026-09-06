import { useState, useEffect, useCallback } from 'react'
import { getData, postFormData, putFormData } from '../../../../api/api'
import { buildAssessmentFormData } from '../utils/assessmentHelpers'

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
      const submitFormData = buildAssessmentFormData(formData, courseId, unitId, sectionId)

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

  const updateAssessment = useCallback(async (assessmentId, formData, courseId, unitId, sectionId) => {
    try {
      setUploadProgress(0)
      const submitFormData = buildAssessmentFormData(formData, courseId, unitId, sectionId)

      const response = await putFormData(`assessments/${assessmentId}`, submitFormData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
        }
      })

      if (response.status === 200) {
        return {
          success: true,
          message: 'Assessment updated successfully!'
        }
      }

      throw new Error('Unexpected response status')
    } catch (error) {
      console.error('Error updating assessment:', error)
      setUploadProgress(0)
      return {
        success: false,
        message: error.data?.message || error.message || 'Error updating assessment'
      }
    }
  }, [])

  return {
    assessors,
    moderators,
    verifiers,
    submitAssessment,
    updateAssessment,
    fetchUsers,
    uploadProgress
  }
}
