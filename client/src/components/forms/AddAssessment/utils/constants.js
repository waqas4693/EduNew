export const ASSESSMENT_TYPES = [
  { value: 'QNA', label: 'Questions and Answers' },
  { value: 'MCQ', label: 'Multiple Choice Questions' },
  { value: 'FILE', label: 'File Based Assessment' }
]

export const MCQ_CONSTRAINTS = {
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 6,
  MIN_CORRECT_ANSWERS: 1
}

export const FORM_FIELD_STYLES = {
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      border: '1px solid #20202033',
      '& fieldset': {
        border: 'none'
      }
    },
    '& .MuiInputLabel-root': {
      color: '#8F8F8F',
      backgroundColor: 'white',
      padding: '0 4px'
    }
  },
  select: {
    borderRadius: '8px',
    border: '1px solid #20202033',
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none'
    }
  },
  button: {
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #20202033',
    '&:hover': {
      border: '1px solid #20202033',
      bgcolor: 'rgba(0, 0, 0, 0.04)'
    }
  }
}

export const INITIAL_FORM_DATA = {
  assessmentType: 'MCQ',
  title: '',
  description: '',
  totalMarks: '',
  percentage: '',
  interval: '',
  isTimeBound: false,
  timeAllowed: '',
  content: {
    mcqs: [],
    questions: [],
    assessmentFile: null,
    supportingFile: null
  }
}

export const INITIAL_MCQ = {
  question: '',
  options: ['', ''],
  numberOfCorrectAnswers: 1,
  correctAnswers: [],
  imageFile: null,
  audioFile: null
}

export const INITIAL_QUESTION = {
  question: ''
}
