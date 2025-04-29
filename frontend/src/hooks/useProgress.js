import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getData, postData } from '../api/api'
import { useMemo } from 'react'

const fetchProgress = async ({ studentId, courseId, unitId, sectionId }) => {
  const response = await getData(`student-progress/${studentId}/${courseId}/${unitId}/${sectionId}`)
  return response.data
}

export const useProgress = (studentId, courseId, unitId, sectionId) => {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['progress', studentId, courseId, unitId, sectionId],
    queryFn: () => fetchProgress({ studentId, courseId, unitId, sectionId }),
    enabled: !!studentId && !!courseId && !!unitId && !!sectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })

  // Memoize progress calculations
  const progress = useMemo(() => {
    if (!data) return {
      section: 0,
      mcq: 0,
      totalMcqs: 0,
      completedMcqs: 0,
      studentProgress: null
    }

    return {
      section: data.sectionProgress || 0,
      mcq: data.mcqProgressPercentage || 0,
      totalMcqs: data.totalMcqs || 0,
      completedMcqs: data.completedMcqs || 0,
      studentProgress: data.progress
    }
  }, [data])

  // Batch update mutation
  const updateProgress = useMutation({
    mutationFn: async (updates) => {
      const response = await postData('batch-update-progress', { updates })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progress'])
    }
  })

  // Get MCQ progress for a specific resource
  const getMcqProgress = (resourceId) => {
    if (!progress.studentProgress?.mcqProgress) return null
    
    return progress.studentProgress.mcqProgress.find(
      p => p.resourceId === resourceId
    )
  }

  // Check if a resource is completed
  const isResourceCompleted = (resourceId) => {
    if (!progress.studentProgress?.mcqProgress) return false
    
    const mcqProgress = progress.studentProgress.mcqProgress.find(
      p => p.resourceId === resourceId
    )
    
    return mcqProgress?.completed || false
  }

  return {
    progress,
    isLoading,
    isError,
    error,
    updateProgress,
    getMcqProgress,
    isResourceCompleted
  }
} 