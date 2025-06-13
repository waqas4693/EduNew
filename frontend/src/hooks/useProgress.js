import { getData, postData } from '../api/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const fetchProgress = async ({ studentId, courseId, unitId, sectionId }) => {
  const response = await getData(`student-progress/${studentId}/${courseId}/${unitId}/${sectionId}`)
  return response.data
}

export const useProgress = (studentId, courseId, unitId, sectionId) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['progress', studentId, courseId, unitId, sectionId],
    queryFn: () => fetchProgress({ studentId, courseId, unitId, sectionId }),
    enabled: !!studentId && !!courseId && !!unitId && !!sectionId,
    staleTime: 0,
    cacheTime: 30 * 60 * 1000,
  })

  // Calculate progress directly from data
  const progress = {
    section: data?.data?.resourceProgressPercentage || 0,
    mcq: data?.data?.mcqProgressPercentage || 0,
    totalMcqs: data?.data?.totalMcqs || 0,
    completedMcqs: data?.data?.completedMcqs || 0,
    studentProgress: data?.data?.progress || null
  }

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

  // Check if a resource has been viewed
  const isResourceViewed = (resourceId) => {
    if (!progress.studentProgress?.viewedResources) return false
    
    return progress.studentProgress.viewedResources.some(
      vr => vr.resourceId === resourceId
    )
  }

  return {
    progress,
    isLoading,
    isError,
    error,
    getMcqProgress,
    isResourceCompleted,
    isResourceViewed,
    refetch
  }
}

export const useUpdateProgress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      resourceId, 
      resourceNumber, 
      studentId, 
      courseId, 
      unitId, 
      sectionId,
      mcqData // Optional parameter for MCQ updates
    }) => {
      if (!studentId || !courseId || !unitId || !sectionId || !resourceId) {
        throw new Error('Missing required parameters')
      }

      // Get current progress from cache
      const currentProgress = queryClient.getQueryData(['progress', studentId, courseId, unitId, sectionId])
      
      // Check if section is already completed (100% resource progress)
      if (currentProgress?.data?.resourceProgressPercentage === 100) {
        console.log('Section already completed (100% progress), skipping progress update')
        return { data: { success: true, message: 'Section already completed' } }
      }

      // Prepare request body
      const requestBody = {
        resourceId,
        resourceNumber,
        ...(mcqData && { mcqData }) // Only include mcqData if it exists
      }

      const response = await postData(
        `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}/progress`,
        requestBody
      )
      return response.data
    },
    onSuccess: (data) => {
      // Only update cache if the section is not already completed
      if (data.data?.progress) {
        queryClient.setQueryData(
          ['progress', data.data.studentId, data.data.courseId, data.data.unitId, data.data.sectionId],
          (oldData) => ({
            ...oldData,
            data: {
              ...oldData?.data,
              ...data.data.progress
            }
          })
        )
        // Then invalidate to ensure we have the latest data
        queryClient.invalidateQueries(['progress', data.data.studentId, data.data.courseId, data.data.unitId, data.data.sectionId])
      }
    }
  })
} 