import { useReducer } from 'react'

const initialState = {
  selectedAnswers: [],
  hasSubmitted: false,
  isCorrect: false,
  attempts: 0
}

const mcqReducer = (state, action) => {
  switch (action.type) {
    case 'SELECT_ANSWER':
      return {
        ...state,
        selectedAnswers: action.payload
      }
    case 'SUBMIT_ANSWERS':
      return {
        ...state,
        hasSubmitted: true,
        isCorrect: action.payload,
        attempts: state.attempts + 1
      }
    case 'RESET':
      return {
        ...initialState,
        attempts: state.attempts
      }
    case 'INITIALIZE':
      return {
        ...initialState,
        attempts: action.payload?.attempts || 0
      }
    default:
      return state
  }
}

const useMcqState = (initialProgress) => {
  const [state, dispatch] = useReducer(mcqReducer, {
    ...initialState,
    attempts: initialProgress?.attempts || 0
  })

  const selectAnswer = (option, numberOfCorrectAnswers) => {
    if (state.hasSubmitted) return

    const currentAnswers = [...state.selectedAnswers]
    const index = currentAnswers.indexOf(option)

    if (index === -1 && currentAnswers.length < numberOfCorrectAnswers) {
      dispatch({ type: 'SELECT_ANSWER', payload: [...currentAnswers, option] })
    } else if (index !== -1) {
      dispatch({
        type: 'SELECT_ANSWER',
        payload: currentAnswers.filter(ans => ans !== option)
      })
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