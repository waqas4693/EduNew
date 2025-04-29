import { useQuery } from '@tanstack/react-query'
import { getData } from '../api/api'

export const useEnrolledCourses = (courseIds) => {
  return useQuery({
    queryKey: ['enrolledCourses', courseIds],
    queryFn: async () => {
      const response = await getData(`courses/enrolled?courseIds=${courseIds.join(',')}`)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
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
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!studentId && !!courseId
  })
}

export const useAssessmentDueDates = (courseId, enrollmentDate) => {
  return useQuery({
    queryKey: ['assessmentDueDates', courseId, enrollmentDate],
    queryFn: async () => {
      // Fetch all data in a single API call
      const response = await getData(`assessments/due-dates/${courseId}?enrollmentDate=${enrollmentDate}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!courseId && !!enrollmentDate
  })
} 