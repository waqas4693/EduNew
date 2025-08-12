import { useState, useCallback } from 'react'
import { INITIAL_FORM_DATA } from '../utils/constants'
import { resetFormData } from '../utils/assessmentHelpers'

/**
 * Custom hook for managing assessment form state
 */
export const useAssessmentForm = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleContentChange = useCallback((contentType, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [contentType]: value
      }
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData(resetFormData())
    setSuccessMessage('')
    setErrorMessage('')
  }, [])

  const setSubmitting = useCallback((value) => {
    setIsSubmitting(value)
  }, [])

  const setSuccess = useCallback((message) => {
    setSuccessMessage(message)
    setErrorMessage('')
  }, [])

  const setError = useCallback((message) => {
    setErrorMessage(message)
    setSuccessMessage('')
  }, [])

  const clearMessages = useCallback(() => {
    setSuccessMessage('')
    setErrorMessage('')
  }, [])

  return {
    formData,
    isSubmitting,
    successMessage,
    errorMessage,
    handleFormChange,
    handleContentChange,
    resetForm,
    setSubmitting,
    setSuccess,
    setError,
    clearMessages
  }
}
