export const getSelectedOptions = (answer) => {
  if (!answer) return []

  if (Array.isArray(answer.selectedOptions)) {
    return answer.selectedOptions.filter(Boolean)
  }

  if (answer.selectedOption) {
    return [answer.selectedOption]
  }

  return []
}

export const getCorrectAnswers = (mcq) => {
  if (Array.isArray(mcq?.correctAnswers) && mcq.correctAnswers.length > 0) {
    return mcq.correctAnswers
  }

  if (mcq?.correctAnswer) {
    return [mcq.correctAnswer]
  }

  return []
}

export const isMcqAnswerCorrect = (mcq, answer) => {
  const selected = [...getSelectedOptions(answer)].sort()
  const correct = [...getCorrectAnswers(mcq)].sort()

  if (selected.length === 0 || correct.length === 0) {
    return false
  }

  if (selected.length !== correct.length) {
    return false
  }

  return selected.every((option, index) => option === correct[index])
}

export const getMcqAttemptStats = (mcqAnswers = [], mcqs = []) =>
  mcqs.reduce(
    (stats, mcq, index) => {
      const answer = mcqAnswers[index]
      const selected = getSelectedOptions(answer)

      if (selected.length === 0) {
        stats.unattempted += 1
      } else if (isMcqAnswerCorrect(mcq, answer)) {
        stats.correct += 1
      } else {
        stats.incorrect += 1
      }

      return stats
    },
    { correct: 0, incorrect: 0, unattempted: 0 }
  )
