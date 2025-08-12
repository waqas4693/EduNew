import { INITIAL_MCQ, INITIAL_QUESTION } from './constants'

/**
 * Helper functions for assessment-related operations
 */

export const calculateRemainingPercentage = (assessments) => {
  const totalUsedPercentage = assessments.reduce((sum, assessment) => sum + assessment.percentage, 0)
  return 100 - totalUsedPercentage
}

export const createNewMCQ = () => ({
  ...INITIAL_MCQ
})

export const createNewQuestion = () => ({
  ...INITIAL_QUESTION
})

export const prepareAssessmentData = (formData, courseId, unitId, sectionId) => {
  return {
    ...formData,
    sectionId,
    courseId,
    unitId
  }
}

export const resetFormData = () => ({
  assessmentType: 'MCQ',
  title: '',
  description: '',
  totalMarks: '',
  percentage: '',
  interval: '',
  isTimeBound: false,
  timeAllowed: '',
  content: {
    questions: [],
    mcqs: [],
    assessmentFile: null,
    supportingFile: null
  }
})

export const getAssessmentTypeLabel = (type) => {
  const typeMap = {
    'QNA': 'Questions and Answers',
    'MCQ': 'Multiple Choice Questions',
    'FILE': 'File Based Assessment'
  }
  return typeMap[type] || type
}

export const shouldShowTimeOptions = (assessmentType) => {
  return assessmentType === 'MCQ'
}

export const isAssessmentValid = (formData) => {
  if (!formData.title || !formData.assessmentType) return false
  
  if (formData.assessmentType === 'MCQ') {
    return formData.content.mcqs && formData.content.mcqs.length > 0
  }
  
  if (formData.assessmentType === 'QNA') {
    return formData.content.questions && formData.content.questions.length > 0
  }
  
  if (formData.assessmentType === 'FILE') {
    return formData.content.assessmentFile !== null
  }
  
  return false
}
