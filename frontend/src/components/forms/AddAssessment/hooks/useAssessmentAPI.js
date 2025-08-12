import { useState, useEffect, useCallback } from 'react'
import { getData } from '../../../../api/api'
import axios from 'axios'
import url from '../../../config/server-url'
import { uploadMCQFiles } from '../utils/fileHelpers'
import { prepareAssessmentData } from '../utils/assessmentHelpers'

/**
 * Custom hook for handling assessment-related API operations
 */
export const useAssessmentAPI = () => {
  const [assessors, setAssessors] = useState([])
  const [moderators, setModerators] = useState([])
  const [verifiers, setVerifiers] = useState([])

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
      const assessmentData = prepareAssessmentData(formData, courseId, unitId, sectionId)
      
      // Handle MCQ file uploads if present
      if (formData.assessmentType === 'MCQ' && formData.content?.mcqs) {
        const mcqsWithFiles = await uploadMCQFiles(formData.content.mcqs)
        assessmentData.content.mcqs = mcqsWithFiles
      }
      
      // Submit the assessment
      const response = await axios.post(`${url}assessments`, assessmentData)
      
      if (response.status === 201) {
        return {
          success: true,
          message: 'Assessment created successfully!'
        }
      }
      
      throw new Error('Unexpected response status')
    } catch (error) {
      console.error('Error creating assessment:', error)
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
    fetchUsers
  }
}
