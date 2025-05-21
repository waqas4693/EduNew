import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getData, postData } from '../api/api'
import { useEffect } from 'react'

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
      const nextPage = page + 1
      queryClient.prefetchQuery({
        queryKey: ['resources', sectionId, nextPage],
        queryFn: () => fetchResources({ sectionId, page: nextPage }),
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
      })
    }
  }

  // Prefetch next page on initial load
  useEffect(() => {
    if (data?.hasMore) {
      prefetchNextPage()
    }
  }, [data?.hasMore])

  return {
    resources: getAllResources(),
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    isError,
    error,
    isFetching,
    prefetchNextPage,
    currentPage: page
  }
}

// Mutation for updating resource progress
export const useUpdateResourceProgress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ resourceId, resourceNumber, isCorrect, attempts, studentId, courseId, unitId, sectionId }) => {
      if (!studentId || !courseId || !unitId || !sectionId || !resourceId) {
        throw new Error('Missing required parameters')
      }
      
      const response = await postData(
        `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}/progress`,
        {
          resourceId,
          resourceNumber,
          mcqData: {
            completed: isCorrect,
            attempts
          }
        }
      )
      return response.data
    },
    onSuccess: (data) => {
      // Immediately update the progress cache
      queryClient.setQueryData(
        ['progress', data.studentId, data.courseId, data.unitId, data.sectionId],
        {
          data: {
            resourceProgressPercentage: data.progress.resourceProgressPercentage,
            mcqProgressPercentage: data.progress.mcqProgressPercentage,
            totalMcqs: data.progress.totalMcqs,
            completedMcqs: data.progress.completedMcqs,
            progress: data.progress
          }
        }
      )
      // Then invalidate to ensure we have the latest data
      queryClient.invalidateQueries(['progress', data.studentId, data.courseId, data.unitId, data.sectionId])
    }
  })
}

// Mutation for recording resource view
export const useRecordResourceView = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ resourceId, resourceNumber, studentId, courseId, unitId, sectionId }) => {
      const response = await postData(
        `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}/progress`,
        {
          resourceId,
          resourceNumber
        }
      )
      return response.data
    },
    onSuccess: (data) => {
      // Immediately update the progress cache
      queryClient.setQueryData(
        ['progress', data.studentId, data.courseId, data.unitId, data.sectionId],
        {
          data: {
            resourceProgressPercentage: data.progress.resourceProgressPercentage,
            mcqProgressPercentage: data.progress.mcqProgressPercentage,
            totalMcqs: data.progress.totalMcqs,
            completedMcqs: data.progress.completedMcqs,
            progress: data.progress
          }
        }
      )
      // Then invalidate to ensure we have the latest data
      queryClient.invalidateQueries(['progress', data.studentId, data.courseId, data.unitId, data.sectionId])
    }
  })
} 