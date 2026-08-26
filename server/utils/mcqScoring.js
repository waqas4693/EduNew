export const getMcqAnswerSelections = (answer) => {
  if (!answer) return []

  if (Array.isArray(answer.selectedOptions)) {
    return answer.selectedOptions.filter(Boolean)
  }

  if (answer.selectedOption) {
    return [answer.selectedOption]
  }

  return []
}

export const getMcqCorrectAnswers = (mcq) => {
  if (Array.isArray(mcq?.correctAnswers) && mcq.correctAnswers.length > 0) {
    return mcq.correctAnswers
  }

  if (mcq?.correctAnswer) {
    return [mcq.correctAnswer]
  }

  return []
}

export const isMcqAnswerCorrect = (mcq, answer) => {
  const selected = [...getMcqAnswerSelections(answer)].sort()
  const correct = [...getMcqCorrectAnswers(mcq)].sort()

  if (selected.length === 0 || correct.length === 0) {
    return false
  }

  if (selected.length !== correct.length) {
    return false
  }

  return selected.every((option, index) => option === correct[index])
}

export const calculateMcqMarks = (mcqs = [], mcqAnswers = [], totalMarks = 100) => {
  if (!mcqs.length) {
    return {
      calculatedMarks: 0,
      totalPossibleMarks: totalMarks,
      percentage: 0
    }
  }

  const marksPerQuestion = totalMarks / mcqs.length
  let obtainedMarks = 0

  mcqs.forEach((mcq, index) => {
    if (isMcqAnswerCorrect(mcq, mcqAnswers[index])) {
      obtainedMarks += marksPerQuestion
    }
  })

  const roundedMarks = Math.round(obtainedMarks)

  return {
    calculatedMarks: roundedMarks,
    totalPossibleMarks: totalMarks,
    percentage: totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0
  }
}

export const calculateMcqMarksFromAttempt = (attempt) => {
  const mcqs = attempt?.assessmentId?.content?.mcqs || []
  const mcqAnswers = attempt?.content?.mcqAnswers || []
  const totalMarks = attempt?.assessmentId?.totalMarks || 100

  return calculateMcqMarks(mcqs, mcqAnswers, totalMarks)
}
