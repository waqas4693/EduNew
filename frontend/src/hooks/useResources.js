import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getData, postData } from '../api/api'

const fetchResources = async ({ sectionId, page = 1, limit = 15 }) => {
  const response = await getData(`resources/${sectionId}?page=${page}&limit=${limit}`)
  return response.data
}

export const useResources = (sectionId, page = 1) => {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching
  } = useQuery({
    queryKey: ['resources', sectionId, page],
    queryFn: () => fetchResources({ sectionId, page }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    keepPreviousData: true, // Keep previous data while fetching new data
  })

  // Get all resources from the cache
  const getAllResources = () => {
    const allResources = []
    let currentPage = 1
    
    while (true) {
      const pageData = queryClient.getQueryData(['resources', sectionId, currentPage])
      if (!pageData) break
      
      allResources.push(...pageData.resources)
      if (!pageData.hasMore) break
      
      currentPage++
    }
    
    return allResources
  }

  // Prefetch next page
  const prefetchNextPage = () => {
    if (data?.hasMore) {
      queryClient.prefetchQuery({
        queryKey: ['resources', sectionId, page + 1],
        queryFn: () => fetchResources({ sectionId, page: page + 1 }),
      })
    }
  }

  return {
    resources: getAllResources(),
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isError,
    error,
    isFetching,
    prefetchNextPage
  }
}

// Mutation for updating resource progress
export const useUpdateResourceProgress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ resourceId, isCorrect, attempts, studentId, courseId, unitId, sectionId }) => {
      if (!studentId || !courseId || !unitId || !sectionId || !resourceId) {
        throw new Error('Missing required parameters')
      }
      
      const response = await postData(`student-progress/${studentId}/${courseId}/${unitId}/${sectionId}/${resourceId}`, {
        completed: isCorrect,
        attempts
      })
      return response.data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['resources'])
      queryClient.invalidateQueries(['progress'])
    }
  })
}

// Mutation for recording resource view
export const useRecordResourceView = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ resourceId, courseId, unitId, sectionId }) => {
      const response = await postData('resource-views/record', {
        resourceId,
        courseId,
        unitId,
        sectionId
      })
      return response.data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['progress'])
    }
  })
} 