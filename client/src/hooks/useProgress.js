import { getData, postData } from '../api/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const fetchProgress = async ({ studentId, courseId, unitId, sectionId }) => {
  const response = await getData(`student-progress/${studentId}/${courseId}/${unitId}/${sectionId}`)
  return response.data
}

const updateProgress = async ({ 
  unitId,
  courseId,
  studentId, 
  sectionId,
  resourceId, 
  resourceNumber, 
  mcqData,
  touchOnly
}) => {

  const requestBody = {
    resourceId,
    resourceNumber,
    ...(mcqData && { mcqData }),
    ...(touchOnly ? { touchOnly: true } : {})
  }

  const response = await postData(
    `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}/progress`,
    requestBody
  )
  return response.data
}

export const useGetStudentProgress = (studentId, courseId, unitId, sectionId) => {
  const {
    data,
    error,
    isError,
    refetch,
    isLoading
  } = useQuery({
    queryKey: ['progress', studentId, courseId, unitId, sectionId],
    queryFn: () => fetchProgress({ studentId, courseId, unitId, sectionId }),
    enabled: !!studentId && !!courseId && !!unitId && !!sectionId,
    staleTime: 0,
    cacheTime: 30 * 60 * 1000,
  })

  return {
    data,
    error,
    isError,
    isLoading,
    refetch,
    progress: data?.progress,
    mcqProgress: data?.progress?.mcqProgress,
    viewedResources: data?.progress?.viewedResources,
    lastAccessedResource: data?.progress?.lastAccessedResource,
    mcqProgressPercentage: data?.progress?.mcqProgressPercentage,
    resourceProgressPercentage: data?.progress?.resourceProgressPercentage,
    completedMcqs: data?.completedMcqs,
    totalMcqs: data?.totalMcqs,
    totalResources: data?.totalResources
  }
}

export const useUpdateProgress = () => {
  const queryClient = useQueryClient()

  const {
    data,
    error,
    mutate,
    isError,
    isSuccess,
    isLoading,
    mutateAsync
  } = useMutation({
    mutationFn: updateProgress,
    onSuccess: (data, variables) => {
      const { studentId, courseId, unitId, sectionId, touchOnly } = variables

      // Bookmark-only updates should not force a progress refetch loop
      if (touchOnly) return

      queryClient.invalidateQueries(['progress', studentId, courseId, unitId, sectionId])
    }
  })

  return {
    mutate,
    mutateAsync,
    isLoading,
    isError,
    error,
    isSuccess,
    data
  }
}