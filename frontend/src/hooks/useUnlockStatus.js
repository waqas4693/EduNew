import { useQuery } from '@tanstack/react-query'
import { getData } from '../api/api'

const fetchUnlockStatus = async ({ studentId, courseId }) => {
  const response = await getData(`course-unlock/${studentId}/${courseId}`)
  return response.data
}

export const useUnlockStatus = (studentId, courseId) => {
  return useQuery({
    queryKey: ['unlockStatus', studentId, courseId],
    queryFn: () => fetchUnlockStatus({ studentId, courseId }),
    enabled: !!studentId && !!courseId,
    staleTime: 0,
    cacheTime: 30 * 60 * 1000
  })
} 