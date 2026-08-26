import { useState, useCallback } from 'react'

const useResourceForm = (initialResources = []) => {
  const [resources, setResources] = useState(initialResources)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const addResource = useCallback((nextNumber) => {
    setResources(prev => [
      ...prev,
      {
        name: '',
        number: nextNumber + prev.length,
        resourceType: '',
        content: {
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
        }
      }
    ])
  }, [])

  const handleFormChange = useCallback((index, field, value) => {
    setResources(prev => {
      const newResources = [...prev]
      newResources[index] = {
        ...newResources[index],
        [field]: value
      }
      return newResources
    })
  }, [])

  const handleContentChange = useCallback((index, field, value) => {
    setResources(prev => {
      const newResources = [...prev]
      if (field === 'mcq') {
        const mcq = {
          ...newResources[index].content.mcq,
          ...value,
          options: value.options || newResources[index].content.mcq?.options || ['', '', '', ''],
          correctAnswers: value.correctAnswers || newResources[index].content.mcq?.correctAnswers || [],
          numberOfCorrectAnswers: value.numberOfCorrectAnswers || newResources[index].content.mcq?.numberOfCorrectAnswers || 1
        }
        
        if (mcq.correctAnswers.length > mcq.numberOfCorrectAnswers) {
          mcq.correctAnswers = mcq.correctAnswers.slice(0, mcq.numberOfCorrectAnswers)
        }
        
        newResources[index] = {
          ...newResources[index],
          content: {
            ...newResources[index].content,
            mcq
          }
        }
      } else {
        newResources[index] = {
          ...newResources[index],
          content: {
            ...newResources[index].content,
            [field]: value
          }
        }
      }
      return newResources
    })
  }, [])

  const removeResource = useCallback((indexToRemove) => {
    setResources(prev => {
      const filtered = prev.filter((_, index) => index !== indexToRemove)
      return filtered.map((resource, index) => ({
        ...resource,
        number: prev[0].number + index
      }))
    })
  }, [])

  return {
    resources,
    setResources,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    error,
    setError,
    addResource,
    handleFormChange,
    handleContentChange,
    removeResource
  }
}

export default useResourceForm 