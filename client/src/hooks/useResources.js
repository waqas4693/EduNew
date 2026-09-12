import { useEffect, useMemo } from 'react'
import { getData } from '../api/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export const RESOURCES_PAGE_SIZE = 15

export const fetchResourcesPage = async ({ sectionId, page = 1, limit = RESOURCES_PAGE_SIZE }) => {
  const response = await getData(`resources/${sectionId}?page=${page}&limit=${limit}`)
  return response.data
}

/**
 * Ensure pages 1..targetPage are in the React Query cache (contiguous merge in useResources).
 */
export const ensureResourcesLoadedThroughPage = async (queryClient, sectionId, targetPage) => {
  const lastPage = Math.max(1, targetPage)

  for (let page = 1; page <= lastPage; page += 1) {
    const existing = queryClient.getQueryData(['resources', sectionId, page])
    if (existing) continue

    await queryClient.fetchQuery({
      queryKey: ['resources', sectionId, page],
      queryFn: () => fetchResourcesPage({ sectionId, page }),
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000
    })
  }
}

/**
 * Load consecutive pages until the resource id is found (or no more pages).
 * Returns { index, page } in the merged list, or null.
 */
export const loadResourcesUntilId = async (queryClient, sectionId, resourceId) => {
  let page = 1

  while (true) {
    let pageData = queryClient.getQueryData(['resources', sectionId, page])
    if (!pageData) {
      pageData = await queryClient.fetchQuery({
        queryKey: ['resources', sectionId, page],
        queryFn: () => fetchResourcesPage({ sectionId, page }),
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000
      })
    }

    const resources = pageData?.resources || []
    const indexInPage = resources.findIndex(
      (resource) => String(resource._id) === String(resourceId)
    )

    if (indexInPage !== -1) {
      const absoluteIndex = (page - 1) * RESOURCES_PAGE_SIZE + indexInPage
      return { index: absoluteIndex, page }
    }

    if (!pageData?.hasMore) {
      return null
    }

    page += 1
  }
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
    queryFn: () => fetchResourcesPage({ sectionId, page }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    keepPreviousData: true,
    enabled: !!sectionId
  })

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
      currentPage += 1
    }

    return resources
  }, [queryClient, sectionId, data])

  const prefetchNextPage = () => {
    if (data?.hasMore) {
      const nextPage = page + 1
      queryClient.prefetchQuery({
        queryKey: ['resources', sectionId, nextPage],
        queryFn: () => fetchResourcesPage({ sectionId, page: nextPage }),
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000
      })
    }
  }

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
