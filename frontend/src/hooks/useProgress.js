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
  mcqData // Optional parameter for MCQ updates
}) => {

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
        // Use IDs from mutation variables instead of API response
        const { studentId, courseId, unitId, sectionId } = variables
        
        // Commenting this out because the staleTime which is 
        // for how long the cache data will be used is 0 and for 
        // every resource loaded in the learner frame the 
        // getStudentProgress function is called therefore the idea 
        // of using the updated data from the response of 
        // updateProgress API is not useful at the moment this 
        // will be used if the staleTime is set to something other that 0

        // queryClient.setQueryData(
        //   ['progress', studentId, courseId, unitId, sectionId],
        //   (oldData) => ({
        //     ...oldData,
        //     data: {
        //       ...oldData?.data,
        //       ...data.data.progress
        //     }
        //   })
        // )
        
        // Then invalidate to ensure we have the latest data
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