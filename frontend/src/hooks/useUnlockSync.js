import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getData, postData } from '../api/api'

export const useStudentCourseUnlockStatus = (studentId, courseId, options = {}) => {
  return useQuery({
    queryKey: ['studentCourseUnlockStatus', studentId, courseId],
    queryFn: async () => {
      const response = await getData(`course-unlock/status/${studentId}/${courseId}`)
      return response.data.status
    },
    enabled: !!studentId && !!courseId && options.enabled !== false,
    staleTime: 0
  })
}

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

export const useSyncCourseUnlock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ studentId, courseId }) => {
      const response = await postData('course-unlock/sync', { studentId, courseId })
      return response.data
    },
    onSuccess: (_data, variables) => {
      const { studentId, courseId } = variables
      queryClient.invalidateQueries({ queryKey: ['studentCourseUnlockStatus', studentId, courseId] })
      queryClient.invalidateQueries({ queryKey: ['unlockStatus', studentId, courseId] })
      queryClient.invalidateQueries({ queryKey: ['unlockedSections', studentId, courseId] })
      queryClient.invalidateQueries({ queryKey: ['completedUnits', studentId, courseId] })
      queryClient.invalidateQueries({ queryKey: ['completedSections', studentId, courseId] })
    }
  })
}
