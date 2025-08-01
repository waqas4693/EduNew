import { useEffect, useMemo } from 'react'
import { getData } from '../api/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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

  // Get all resources from the cache using useMemo for better performance
  const allResources = useMemo(() => {
    const resources = []
    let currentPage = 1
    
    while (true) {
      const pageData = queryClient.getQueryData(['resources', sectionId, currentPage])
      if (!pageData) break
      
      if (pageData.resources && Array.isArray(pageData.resources)) {
        resources.push(...pageData.resources)
      }
      
      if (!pageData.hasMore) break
      currentPage++
    }
    
    return resources
  }, [queryClient, sectionId, data]) // Include data in dependencies to re-compute when new data arrives

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
    resources: allResources,
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