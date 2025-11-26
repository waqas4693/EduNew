import { useReducer } from 'react'

const initialState = {
  selectedAnswers: [],
  hasSubmitted: false,
  isCorrect: false,
  attempts: 0
}

const mcqReducer = (state, action) => {
  
  let newState
  
  switch (action.type) {
    case 'SELECT_ANSWER':
      newState = {
        ...state,
        selectedAnswers: action.payload
      }
      break
      
    case 'SUBMIT_ANSWERS':
      newState = {
        ...state,
        hasSubmitted: true,
        isCorrect: action.payload,
        attempts: state.attempts + 1
      }
      break
      
    case 'RESET':
      newState = {
        ...initialState,
        attempts: state.attempts
      }
      break
      
    case 'INITIALIZE':
      newState = {
        ...initialState,
        attempts: action.payload?.attempts || 0
      }
      break
      
    default:
      return state
  }
  
  return newState
}

const useMcqState = (initialProgress) => {

  
  const [state, dispatch] = useReducer(mcqReducer, {
    ...initialState,
    attempts: initialProgress?.attempts || 0
  })


  const selectAnswer = (option, numberOfCorrectAnswers) => {
    console.log('selectAnswer called with:', { option, numberOfCorrectAnswers, currentAnswers: state.selectedAnswers })
    
    if (state.hasSubmitted) {
      return
    }

    const currentAnswers = [...state.selectedAnswers]
    const index = currentAnswers.indexOf(option)

    console.log('Current answers:', currentAnswers, 'Option index:', index)

    if (index === -1 && currentAnswers.length < numberOfCorrectAnswers) {
      const newAnswers = [...currentAnswers, option]
      console.log('Adding option, new answers:', newAnswers)
      dispatch({ type: 'SELECT_ANSWER', payload: newAnswers })
    } else if (index !== -1) {
      const newAnswers = currentAnswers.filter(ans => ans !== option)
      console.log('Removing option, new answers:', newAnswers)
      dispatch({
        type: 'SELECT_ANSWER',
        payload: newAnswers
      })
    } else {
      console.log('Option not added - limit reached or already selected')
    }
  }

  const submitAnswers = (correctAnswers) => {

    
    if (state.selectedAnswers.length !== correctAnswers.length) {
 
      return false
    }

    const isCorrect =
      state.selectedAnswers.length === correctAnswers.length &&
      state.selectedAnswers.every(answer => correctAnswers.includes(answer))


    dispatch({ type: 'SUBMIT_ANSWERS', payload: isCorrect })
    return isCorrect
  }

  const reset = () => {

    dispatch({ type: 'RESET' })
  }

  const initialize = (progress) => {

    dispatch({ type: 'INITIALIZE', payload: progress })
  }


  
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