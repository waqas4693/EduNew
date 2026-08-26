import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getData, postData } from '../api/api'

export const useCompletedSections = (studentId, courseId) => {
  return useQuery({
    queryKey: ['completedSections', studentId, courseId],
    queryFn: async () => {
      const response = await getData(`course-unlock/completed-sections/${studentId}/${courseId}`)
      return response.data.completedSections || []
    },
    enabled: !!studentId && !!courseId,
    staleTime: 0
  })
}

const invalidateUnlockCaches = (queryClient, studentId, courseId) => {
  queryClient.invalidateQueries({ queryKey: ['unlockStatus', studentId, courseId] })
  queryClient.invalidateQueries({ queryKey: ['unlockedSections', studentId, courseId] })
  queryClient.invalidateQueries({ queryKey: ['completedUnits', studentId, courseId] })
  queryClient.invalidateQueries({ queryKey: ['completedSections', studentId, courseId] })
}

export const useSyncCourseUnlock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ studentId, courseId }) => {
      // Repair = heal legacy MCQ flags + sync unlock watermark
      const response = await postData('course-unlock/repair', { studentId, courseId })
      return response.data
    },
    onSuccess: (_data, variables) => {
      invalidateUnlockCaches(queryClient, variables.studentId, variables.courseId)
    }
  })
}
