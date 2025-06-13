export const RESOURCE_TYPES = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'PPT', label: 'PPT Slides' },
  { value: 'TEXT', label: 'Text with Questions' },
  { value: 'MCQ', label: 'Multiple Choice Question' }
]

export const getFileAcceptTypes = (resourceType) => {
  switch (resourceType) {
    case 'VIDEO':
      return 'video/*'
    case 'IMAGE':
      return 'image/*'
    case 'AUDIO':
      return 'audio/*'
    case 'PDF':
      return '.pdf'
    case 'PPT':
      return '.ppt,.pptx'
    default:
      return ''
  }
}

export const getInitialResourceContent = () => ({
  fileName: '',
  questions: [
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ],
  backgroundImage: '',
  previewImage: '',
  file: null,
  thumbnail: null,
  externalLinks: [
    { name: '', url: '' }
  ],
  audioFile: null,
  audioRepeatCount: 1,
  mcq: {
    question: '',
    options: ['', '', '', ''],
    numberOfCorrectAnswers: 1,
    correctAnswers: [],
    imageFile: null,
    audioFile: null
  }
})

export const validateResource = (resource) => {
  const errors = []

  if (!resource.name) {
    errors.push('Resource name is required')
  }

  if (!resource.resourceType) {
    errors.push('Resource type is required')
  }

  if (resource.resourceType === 'MCQ') {
    if (!resource.content.mcq?.question) {
      errors.push('MCQ question is required')
    }
    if (!resource.content.mcq?.options?.some(opt => opt)) {
      errors.push('At least one MCQ option is required')
    }
    if (!resource.content.mcq?.correctAnswers?.length) {
      errors.push('At least one correct answer is required')
    }
  }

  return errors
}

export const processResourceContent = (content, resourceType) => {
  const processedContent = { ...content }

  // Remove any undefined or null values
  Object.keys(processedContent).forEach(key => {
    if (processedContent[key] === undefined || processedContent[key] === null) {
      delete processedContent[key]
    }
  })

  // Process MCQ content
  if (resourceType === 'MCQ' && processedContent.mcq) {
    processedContent.mcq = {
      ...processedContent.mcq,
      options: processedContent.mcq.options.filter(opt => opt),
      correctAnswers: processedContent.mcq.correctAnswers.filter(ca => ca)
    }
  }

  // Process questions
  if (processedContent.questions) {
    processedContent.questions = processedContent.questions.filter(
      q => q.question && q.answer
    )
  }

  // Process external links
  if (processedContent.externalLinks) {
    // Filter out empty links but ensure at least one empty link remains
    const nonEmptyLinks = processedContent.externalLinks.filter(
      link => link.name && link.url
    )
    processedContent.externalLinks = nonEmptyLinks.length > 0 
      ? nonEmptyLinks 
      : [{ name: '', url: '' }]
  } else {
    // Initialize externalLinks if it doesn't exist
    processedContent.externalLinks = [{ name: '', url: '' }]
  }

  return processedContent
} 