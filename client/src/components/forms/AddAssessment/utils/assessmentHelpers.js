import { INITIAL_MCQ, INITIAL_QUESTION } from './constants'

/**
 * Helper functions for assessment-related operations
 */

export const calculateRemainingPercentage = (assessments, excludeId = null) => {
  const totalUsedPercentage = assessments.reduce((sum, assessment) => {
    if (excludeId && String(assessment._id) === String(excludeId)) {
      return sum
    }
    return sum + (Number(assessment.percentage) || 0)
  }, 0)
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
  assessor: '',
  moderator: '',
  verifier: '',
  content: {
    questions: [],
    mcqs: [],
    assessmentFile: null,
    supportingFile: null
  }
})

export const mapAssessmentToFormData = (assessment) => {
  const typeLabel = getAssessmentTypeLabel(assessment.assessmentType)
  const content = assessment.content || {}

  return {
    assessmentType: assessment.assessmentType || 'MCQ',
    title: assessment.title || typeLabel,
    description: assessment.description || '',
    totalMarks: assessment.totalMarks ?? '',
    percentage: assessment.percentage ?? '',
    interval: assessment.interval ?? '',
    isTimeBound: Boolean(assessment.isTimeBound),
    timeAllowed: assessment.timeAllowed ?? '',
    assessor: assessment.assessor?._id || assessment.assessor || '',
    moderator: assessment.moderator?._id || assessment.moderator || '',
    verifier: assessment.verifier?._id || assessment.verifier || '',
    content: {
      questions: (content.questions || []).map((item) => ({
        question: item.question || '',
        answer: item.answer || ''
      })),
      mcqs: (content.mcqs || []).map((mcq) => ({
        question: mcq.question || '',
        options: Array.isArray(mcq.options) ? [...mcq.options] : ['', ''],
        numberOfCorrectAnswers: mcq.numberOfCorrectAnswers || 1,
        correctAnswers: Array.isArray(mcq.correctAnswers) ? [...mcq.correctAnswers] : [],
        imageFile: mcq.imageFile || null,
        audioFile: mcq.audioFile || null
      })),
      assessmentFile: content.assessmentFile || null,
      supportingFile: content.supportingFile || null
    }
  }
}

export const getAssessmentTypeLabel = (type) => {
  const typeMap = {
    QNA: 'Questions and Answers',
    MCQ: 'Multiple Choice Questions',
    FILE: 'File Based Assessment'
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

export const buildAssessmentFormData = (formData, courseId, unitId, sectionId) => {
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

      if (formData.assessmentType === 'QNA') {
        contentCopy.questions = (contentCopy.questions || []).map((item) => ({
          question: item.question || '',
          answer: item.answer || ''
        }))
        delete contentCopy.mcqs
        delete contentCopy.assessmentFile
        delete contentCopy.supportingFile
      }

      submitFormData.append('content', JSON.stringify(contentCopy))
    } else if (assessmentData[key] !== undefined && assessmentData[key] !== null) {
      submitFormData.append(key, assessmentData[key])
    }
  })

  return submitFormData
}
