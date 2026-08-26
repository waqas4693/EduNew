import { useQuery } from '@tanstack/react-query'
import { getData } from '../api/api'

export const useUnits = (courseId) => {
  return useQuery({
    queryKey: ['units', courseId],
    queryFn: async () => {
      const response = await getData(`units/${courseId}`)
      return response.data.units
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!courseId
  })
}

export const useUnitDetails = (unitId) => {
  return useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      const response = await getData(`units/${unitId}`)
      return response.data.unit
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    enabled: !!unitId
  })
} 