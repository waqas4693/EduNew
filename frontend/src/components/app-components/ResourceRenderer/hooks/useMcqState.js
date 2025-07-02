import { useReducer } from 'react'

const initialState = {
  selectedAnswers: [],
  hasSubmitted: false,
  isCorrect: false,
  attempts: 0
}

const mcqReducer = (state, action) => {
  console.log('=== MCQ Reducer Action ===')
  console.log('Action type:', action.type)
  console.log('Current state:', state)
  console.log('Action payload:', action.payload)
  
  let newState
  
  switch (action.type) {
    case 'SELECT_ANSWER':
      newState = {
        ...state,
        selectedAnswers: action.payload
      }
      console.log('SELECT_ANSWER: Updated selected answers to:', action.payload)
      break
      
    case 'SUBMIT_ANSWERS':
      newState = {
        ...state,
        hasSubmitted: true,
        isCorrect: action.payload,
        attempts: state.attempts + 1
      }
      console.log('SUBMIT_ANSWERS: Submission result:', {
        isCorrect: action.payload,
        newAttempts: state.attempts + 1
      })
      break
      
    case 'RESET':
      newState = {
        ...initialState,
        attempts: state.attempts
      }
      console.log('RESET: Resetting state, keeping attempts:', state.attempts)
      break
      
    case 'INITIALIZE':
      newState = {
        ...initialState,
        attempts: action.payload?.attempts || 0
      }
      console.log('INITIALIZE: Initializing with attempts:', action.payload?.attempts || 0)
      break
      
    default:
      console.warn('Unknown action type:', action.type)
      return state
  }
  
  console.log('New state:', newState)
  return newState
}

const useMcqState = (initialProgress) => {
  console.log('=== useMcqState Hook Initialized ===')
  console.log('Initial progress:', initialProgress)
  
  const [state, dispatch] = useReducer(mcqReducer, {
    ...initialState,
    attempts: initialProgress?.attempts || 0
  })

  console.log('Initial MCQ state:', state)

  const selectAnswer = (option, numberOfCorrectAnswers) => {
    console.log('=== selectAnswer Called ===')
    console.log('Parameters:', { option, numberOfCorrectAnswers })
    console.log('Current state:', {
      selectedAnswers: state.selectedAnswers,
      hasSubmitted: state.hasSubmitted
    })
    
    if (state.hasSubmitted) {
      console.log('Cannot select answer - already submitted')
      return
    }

    const currentAnswers = [...state.selectedAnswers]
    const index = currentAnswers.indexOf(option)
    
    console.log('Answer selection logic:', {
      currentAnswers,
      option,
      index,
      canAdd: index === -1 && currentAnswers.length < numberOfCorrectAnswers,
      canRemove: index !== -1
    })

    if (index === -1 && currentAnswers.length < numberOfCorrectAnswers) {
      const newAnswers = [...currentAnswers, option]
      console.log('Adding answer:', { option, newAnswers })
      dispatch({ type: 'SELECT_ANSWER', payload: newAnswers })
    } else if (index !== -1) {
      const newAnswers = currentAnswers.filter(ans => ans !== option)
      console.log('Removing answer:', { option, newAnswers })
      dispatch({
        type: 'SELECT_ANSWER',
        payload: newAnswers
      })
    } else {
      console.log('No action taken - selection limit reached or answer not found')
    }
  }

  const submitAnswers = (correctAnswers) => {
    console.log('=== submitAnswers Called ===')
    console.log('Parameters:', { correctAnswers })
    console.log('Current selected answers:', state.selectedAnswers)
    
    if (state.selectedAnswers.length !== correctAnswers.length) {
      console.log('Answer count mismatch:', {
        selected: state.selectedAnswers.length,
        required: correctAnswers.length
      })
      return false
    }

    const isCorrect =
      state.selectedAnswers.length === correctAnswers.length &&
      state.selectedAnswers.every(answer => correctAnswers.includes(answer))

    console.log('Answer validation:', {
      selectedAnswers: state.selectedAnswers,
      correctAnswers,
      isCorrect,
      allSelectedAreCorrect: state.selectedAnswers.every(answer => correctAnswers.includes(answer))
    })

    dispatch({ type: 'SUBMIT_ANSWERS', payload: isCorrect })
    return isCorrect
  }

  const reset = () => {
    console.log('=== reset Called ===')
    console.log('Resetting MCQ state')
    dispatch({ type: 'RESET' })
  }

  const initialize = (progress) => {
    console.log('=== initialize Called ===')
    console.log('Initializing with progress:', progress)
    dispatch({ type: 'INITIALIZE', payload: progress })
  }

  console.log('=== useMcqState Hook Return ===')
  console.log('Current state:', state)
  
  return {
    state,
    actions: {
      selectAnswer,
      submitAnswers,
      reset,
      initialize
    }
  }
}

export default useMcqState 