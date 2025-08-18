/**
 * Validation rules and functions for assessment forms
 */

export const validateForm = (formData, sectionId, remainingPercentage) => {
  const errors = []

  // Required fields validation
  if (!sectionId || !formData.title || !formData.assessmentType || 
      !formData.totalMarks || !formData.percentage || !formData.interval) {
    errors.push('Please fill all required fields')
    return { isValid: false, errors }
  }

  // Interval validation
  if (Number(formData.interval) <= 0) {
    errors.push('Interval must be greater than 0')
  }

  // Percentage validation
  if (Number(formData.percentage) > remainingPercentage) {
    errors.push(`Percentage cannot exceed ${remainingPercentage}%`)
  }

  // Time-bound assessment validation - only validate if time-bound is explicitly enabled
  // Only validate time for MCQ assessments that are explicitly marked as time-bound
  if (formData.assessmentType === 'MCQ' && formData.isTimeBound === true) {
    if (!formData.timeAllowed || Number(formData.timeAllowed) <= 0) {
      errors.push('Time duration must be a positive number for time-bound assessments')
    }
  }

  // MCQ content validation
  if (formData.assessmentType === 'MCQ') {
    const mcqErrors = validateMCQContent(formData.content.mcqs)
    errors.push(...mcqErrors)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateMCQContent = (mcqs) => {
  const errors = []

  if (!mcqs || mcqs.length === 0) {
    errors.push('Please add at least one MCQ')
    return errors
  }

  for (let i = 0; i < mcqs.length; i++) {
    const mcq = mcqs[i]
    
    if (!mcq.question.trim()) {
      errors.push(`Please enter a question for MCQ ${i + 1}`)
    }
    
    if (mcq.options.filter(opt => opt.trim()).length < 2) {
      errors.push(`MCQ ${i + 1} must have at least 2 options`)
    }
    
    if (mcq.correctAnswers.length === 0) {
      errors.push(`Please select correct answers for MCQ ${i + 1}`)
    }
    
    if (mcq.correctAnswers.length > mcq.numberOfCorrectAnswers) {
      errors.push(`MCQ ${i + 1} has more correct answers selected than allowed`)
    }
  }

  return errors
}

export const validateQNAContent = (questions) => {
  const errors = []

  if (!questions || questions.length === 0) {
    errors.push('Please add at least one question')
    return errors
  }

  for (let i = 0; i < questions.length; i++) {
    if (!questions[i].question.trim()) {
      errors.push(`Please enter text for question ${i + 1}`)
    }
  }

  return errors
}

export const validateFileContent = (content) => {
  const errors = []

  if (!content.assessmentFile) {
    errors.push('Please upload an assessment file')
  }

  return errors
}
