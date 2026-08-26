import { useQuery } from '@tanstack/react-query'
import { getData } from '../api/api'

export const useEnrolledCourses = (courseIds) => {
  return useQuery({
    queryKey: ['enrolledCourses', courseIds],
    queryFn: async () => {
      const response = await getData(`courses/enrolled?courseIds=${courseIds.join(',')}`)
      return response.data.data
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled: !!courseIds?.length
  })
}

export const useCourseProgress = (studentId, courseId) => {
  return useQuery({
    queryKey: ['courseProgress', studentId, courseId],
    queryFn: async () => {
      const response = await getData(`student/${studentId}/courses/${courseId}/progress`)
      return response.data.data
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled: !!studentId && !!courseId
  })
}

export const useAssessmentDueDates = (courseId, enrollmentDate) => {
  return useQuery({
    queryKey: ['assessmentDueDates', courseId, enrollmentDate],
    queryFn: async () => {
      const response = await getData(`assessments/due-dates/${courseId}?enrollmentDate=${enrollmentDate}`)
      return response.data
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled: !!courseId && !!enrollmentDate
  })
} 