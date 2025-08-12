import { useCallback } from 'react'
import { validateForm, validateMCQContent, validateQNAContent, validateFileContent } from '../utils/validationRules'

/**
 * Custom hook for form validation logic
 */
export const useFormValidation = () => {
  const validateAssessmentForm = useCallback((formData, sectionId, remainingPercentage) => {
    return validateForm(formData, sectionId, remainingPercentage)
  }, [])

  const validateAssessmentContent = useCallback((assessmentType, content) => {
    switch (assessmentType) {
      case 'MCQ':
        return {
          isValid: validateMCQContent(content.mcqs).length === 0,
          errors: validateMCQContent(content.mcqs)
        }
      case 'QNA':
        return {
          isValid: validateQNAContent(content.questions).length === 0,
          errors: validateQNAContent(content.questions)
        }
      case 'FILE':
        return {
          isValid: validateFileContent(content).length === 0,
          errors: validateFileContent(content)
        }
      default:
        return {
          isValid: false,
          errors: ['Invalid assessment type']
        }
    }
  }, [])

  const showValidationErrors = useCallback((errors) => {
    if (errors.length > 0) {
      alert(errors.join('\n'))
      return true
    }
    return false
  }, [])

  return {
    validateAssessmentForm,
    validateAssessmentContent,
    showValidationErrors
  }
}
