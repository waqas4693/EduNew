import { useQuery } from '@tanstack/react-query'
import { getData } from '../api/api'

export const useSections = (unitId) => {
  return useQuery({
    queryKey: ['sections', unitId],
    queryFn: async () => {
      const response = await getData(`sections/${unitId}`)
      return response.data.sections
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!unitId
  })
}

export const useUnlockedSections = (studentId, courseId, unitId) => {
  return useQuery({
    queryKey: ['unlockedSections', studentId, courseId, unitId],
    queryFn: async () => {
      const response = await getData(`section-unlock/${studentId}/${courseId}`)
      return response.data.unlockedSections
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!studentId && !!courseId && !!unitId
  })
}

export const useSectionCompletion = (studentId, courseId, unitId, sectionId) => {
  return useQuery({
    queryKey: ['sectionCompletion', studentId, courseId, unitId, sectionId],
    queryFn: async () => {
      const response = await getData(`section-unlock/check-completion/${studentId}/${courseId}/${unitId}/${sectionId}`)
      return response.data.isCompleted
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!studentId && !!courseId && !!unitId && !!sectionId
  })
} 