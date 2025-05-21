import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getData, postData } from '../api/api'

const fetchProgress = async ({ studentId, courseId, unitId, sectionId }) => {
  console.log('Fetching progress for:', { studentId, courseId, unitId, sectionId })
  const response = await getData(`student-progress/${studentId}/${courseId}/${unitId}/${sectionId}`)
  console.log('Progress response:', response.data)
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
    staleTime: 0, // Remove stale time to always get fresh data
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })

  // Calculate progress directly from data
  const progress = {
    section: data?.data?.resourceProgressPercentage || 0,
    mcq: data?.data?.mcqProgressPercentage || 0,
    totalMcqs: data?.data?.totalMcqs || 0,
    completedMcqs: data?.data?.completedMcqs || 0,
    studentProgress: data?.data?.progress || null
  }

  // Update progress mutation
  const updateProgress = useMutation({
    mutationFn: async ({ resourceId, resourceNumber, mcqData }) => {
      const response = await postData(
        `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}/progress`,
        { resourceId, resourceNumber, mcqData }
      )
      return response.data
    },
    onSuccess: () => {
      // Invalidate the progress query to trigger a refetch
      queryClient.invalidateQueries(['progress', studentId, courseId, unitId, sectionId])
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
    updateProgress,
    getMcqProgress,
    isResourceCompleted,
    isResourceViewed
  }
} 