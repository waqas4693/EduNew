import { useQuery } from '@tanstack/react-query'
import { getData } from '../api/api'

const fetchCompletedUnits = async ({ studentId, courseId }) => {
  const response = await getData(`course-unlock/completed/${studentId}/${courseId}`)
  return response.data.completedUnits || []
}

export const useCompletedUnits = (studentId, courseId) => {
  return useQuery({
    queryKey: ['completedUnits', studentId, courseId],
    queryFn: () => fetchCompletedUnits({ studentId, courseId }),
    enabled: !!studentId && !!courseId,
    staleTime: 0,
    cacheTime: 30 * 60 * 1000
  })
}

