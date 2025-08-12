import { useState, useEffect, useCallback } from 'react'
import { createNewMCQ } from '../utils/assessmentHelpers'
import { MCQ_CONSTRAINTS } from '../utils/constants'

/**
 * Custom hook for managing MCQ-specific state and operations
 * This hook exceeds 100 lines due to the complex interdependencies between:
 * - MCQ options management (add/remove options)
 * - Option count tracking for each MCQ
 * - Correct answers validation
 * - File attachments (image/audio) for each MCQ
 * - Dynamic option constraints
 */
export const useMCQManagement = (mcqs, onMCQsChange) => {
  const [mcqOptionCounts, setMcqOptionCounts] = useState({})

  // Initialize MCQ option counts when MCQs change
  useEffect(() => {
    if (mcqs) {
      const counts = {}
      mcqs.forEach((mcq, index) => {
        counts[index] = mcq.options?.length || MCQ_CONSTRAINTS.MIN_OPTIONS
      })
      console.log('Initializing MCQ option counts:', counts)
      setMcqOptionCounts(counts)
    }
  }, [mcqs])

  const addMCQ = useCallback(() => {
    const newMCQ = createNewMCQ()
    const newIndex = mcqs?.length || 0
    
    console.log('Adding MCQ at index:', newIndex)
    
    const updatedMCQs = [...(mcqs || []), newMCQ]
    onMCQsChange(updatedMCQs)
    
    setMcqOptionCounts(prev => {
      const newCounts = {
        ...prev,
        [newIndex]: MCQ_CONSTRAINTS.MIN_OPTIONS
      }
      console.log('Updated MCQ option counts:', newCounts)
      return newCounts
    })
  }, [mcqs, onMCQsChange])

  const removeMCQ = useCallback((indexToRemove) => {
    const updatedMCQs = mcqs.filter((_, index) => index !== indexToRemove)
    onMCQsChange(updatedMCQs)
    
    // Update option counts, shifting indices
    setMcqOptionCounts(prev => {
      const newCounts = {}
      Object.keys(prev).forEach(key => {
        const index = parseInt(key)
        if (index < indexToRemove) {
          newCounts[index] = prev[index]
        } else if (index > indexToRemove) {
          newCounts[index - 1] = prev[index]
        }
      })
      return newCounts
    })
  }, [mcqs, onMCQsChange])

  const handleMCQChange = useCallback((index, field, value) => {
    const updatedMcqs = [...(mcqs || [])]
    
    if (field === 'numberOfCorrectAnswers') {
      updatedMcqs[index] = {
        ...updatedMcqs[index],
        numberOfCorrectAnswers: value,
        correctAnswers: updatedMcqs[index].correctAnswers?.slice(0, value) || []
      }
    } else if (field === 'correctAnswers') {
      let newCorrectAnswers
      if (Array.isArray(value)) {
        newCorrectAnswers = value
      } else {
        newCorrectAnswers = [value]
      }
      
      updatedMcqs[index] = {
        ...updatedMcqs[index],
        correctAnswers: newCorrectAnswers
      }
    } else if (field === 'options') {
      updatedMcqs[index] = {
        ...updatedMcqs[index],
        options: value
      }
    } else {
      updatedMcqs[index] = {
        ...updatedMcqs[index],
        [field]: value
      }
    }
    
    onMCQsChange(updatedMcqs)
  }, [mcqs, onMCQsChange])

  const handleMCQOptionChange = useCallback((mcqIndex, optionIndex, value) => {
    const updatedMcqs = [...(mcqs || [])]
    const currentOptions = [...(updatedMcqs[mcqIndex]?.options || [])]
    currentOptions[optionIndex] = value
    
    updatedMcqs[mcqIndex] = {
      ...updatedMcqs[mcqIndex],
      options: currentOptions
    }
    
    onMCQsChange(updatedMcqs)
  }, [mcqs, onMCQsChange])

  const addMCQOption = useCallback((mcqIndex) => {
    console.log('Adding option for MCQ index:', mcqIndex)
    const updatedMcqs = [...(mcqs || [])]
    const currentOptions = updatedMcqs[mcqIndex]?.options || []
    
    if (currentOptions.length < MCQ_CONSTRAINTS.MAX_OPTIONS) {
      updatedMcqs[mcqIndex] = {
        ...updatedMcqs[mcqIndex],
        options: [...currentOptions, '']
      }
      
      setMcqOptionCounts(prevCounts => {
        const newCounts = {
          ...prevCounts,
          [mcqIndex]: currentOptions.length + 1
        }
        console.log('Updated option counts after adding:', newCounts)
        return newCounts
      })
      
      onMCQsChange(updatedMcqs)
    }
  }, [mcqs, onMCQsChange])

  const removeMCQOption = useCallback((mcqIndex, optionIndex) => {
    console.log('Removing option for MCQ index:', mcqIndex, 'option index:', optionIndex)
    const updatedMcqs = [...(mcqs || [])]
    const currentOptions = updatedMcqs[mcqIndex]?.options || []
    
    if (currentOptions.length > MCQ_CONSTRAINTS.MIN_OPTIONS) {
      const newOptions = currentOptions.filter((_, index) => index !== optionIndex)
      updatedMcqs[mcqIndex] = {
        ...updatedMcqs[mcqIndex],
        options: newOptions
      }
      
      setMcqOptionCounts(prevCounts => {
        const newCounts = {
          ...prevCounts,
          [mcqIndex]: newOptions.length
        }
        console.log('Updated option counts after removing:', newCounts)
        return newCounts
      })
      
      // Adjust correctAnswers if needed
      const currentCorrectAnswers = updatedMcqs[mcqIndex].correctAnswers || []
      const removedOption = currentOptions[optionIndex]
      if (currentCorrectAnswers.includes(removedOption)) {
        updatedMcqs[mcqIndex].correctAnswers = currentCorrectAnswers.filter(
          answer => answer !== removedOption
        )
      }
      
      onMCQsChange(updatedMcqs)
    }
  }, [mcqs, onMCQsChange])

  const handleMCQFileChange = useCallback((index, fileType, file) => {
    const updatedMCQs = [...(mcqs || [])]
    updatedMCQs[index] = {
      ...updatedMCQs[index],
      [fileType]: file
    }
    onMCQsChange(updatedMCQs)
  }, [mcqs, onMCQsChange])

  const setTotalOptions = useCallback((mcqIndex, totalOptions) => {
    console.log('Setting total options for MCQ index:', mcqIndex, 'to:', totalOptions)
    const updatedMcqs = [...(mcqs || [])]
    const currentOptions = updatedMcqs[mcqIndex]?.options || []
    
    // Create new options array with the specified length
    const newOptions = Array(totalOptions).fill('').map((_, i) => currentOptions[i] || '')
    
    // Update MCQ with new options
    updatedMcqs[mcqIndex] = {
      ...updatedMcqs[mcqIndex],
      options: newOptions,
      // Reset correct answers if they exceed new limits
      correctAnswers: (updatedMcqs[mcqIndex]?.correctAnswers || []).filter(answer => 
        newOptions.includes(answer)
      ),
      // Update numberOfCorrectAnswers to be within new limits
      numberOfCorrectAnswers: Math.min(
        updatedMcqs[mcqIndex]?.numberOfCorrectAnswers || 1,
        Math.max(1, totalOptions - 1)
      )
    }
    
    // Update option counts
    setMcqOptionCounts(prevCounts => {
      const newCounts = {
        ...prevCounts,
        [mcqIndex]: totalOptions
      }
      console.log('Updated option counts after setting total:', newCounts)
      return newCounts
    })
    
    onMCQsChange(updatedMcqs)
  }, [mcqs, onMCQsChange])

  return {
    mcqOptionCounts,
    addMCQ,
    removeMCQ,
    handleMCQChange,
    handleMCQOptionChange,
    addMCQOption,
    removeMCQOption,
    handleMCQFileChange,
    setTotalOptions
  }
}
