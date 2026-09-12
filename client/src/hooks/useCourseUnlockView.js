import { useQuery } from '@tanstack/react-query'
import { getData } from '../api/api'

/**
 * Single source of truth for the units page: unlock + completion + course metadata.
 * Always fetches fresh — no client-side unlock math.
 */
export const useUnitsUnlockView = (studentId, courseId) => {
  return useQuery({
    queryKey: ['unitsUnlockView', studentId, courseId],
    queryFn: async () => {
      const response = await getData(`course-unlock/units/${studentId}/${courseId}`)
      return response.data
    },
    enabled: !!studentId && !!courseId,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  })
}

/**
 * Single source of truth for the sections page: unlock + completion + course/unit names.
 */
export const useSectionsUnlockView = (studentId, courseId, unitId) => {
  return useQuery({
    queryKey: ['sectionsUnlockView', studentId, courseId, unitId],
    queryFn: async () => {
      const response = await getData(
        `course-unlock/sections/${studentId}/${courseId}/${unitId}`
      )
      return response.data
    },
    enabled: !!studentId && !!courseId && !!unitId,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  })
}
