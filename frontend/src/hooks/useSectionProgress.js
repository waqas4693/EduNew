import { useState, useEffect, useMemo, useCallback } from 'react'
import { getData } from '../api/api'

// Hook to get progress for multiple sections
export const useSectionProgress = (studentId, courseId, unitId, sectionIds) => {
  const [progressData, setProgressData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Memoize the section IDs to prevent unnecessary re-fetches
  const memoizedSectionIds = useMemo(() => {
    return sectionIds || []
  }, [sectionIds])

  useEffect(() => {
    const fetchSectionProgress = async () => {
      if (!studentId || !courseId || !unitId || !memoizedSectionIds || memoizedSectionIds.length === 0) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch progress for all sections in parallel
        const progressPromises = memoizedSectionIds.map(async (sectionId) => {
          try {
            const response = await getData(`student-progress/${studentId}/${courseId}/${unitId}/${sectionId}`)
            return {
              sectionId,
              progress: response.data?.data || null,
              error: null
            }
          } catch (err) {
            console.error(`Error fetching progress for section ${sectionId}:`, err)
            return {
              sectionId,
              progress: null,
              error: err.message
            }
          }
        })

        const results = await Promise.all(progressPromises)
        
        // Convert results to a map for easy lookup
        const progressMap = results.reduce((acc, result) => {
          acc[result.sectionId] = {
            progress: result.progress,
            error: result.error
          }
          return acc
        }, {})

        setProgressData(progressMap)
      } catch (err) {
        console.error('Error fetching section progress:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSectionProgress()
  }, [studentId, courseId, unitId, memoizedSectionIds])

  // Helper function to get progress for a specific section (memoized)
  const getSectionProgress = useCallback((sectionId) => {
    return progressData[sectionId] || { progress: null, error: null }
  }, [progressData])

  // Helper function to check if a section is completed (memoized)
  const isSectionCompleted = useCallback((sectionId) => {
    const { progress } = getSectionProgress(sectionId)
    return progress?.resourceProgressPercentage === 100
  }, [getSectionProgress])

  return {
    progressData,
    isLoading,
    error,
    getSectionProgress,
    isSectionCompleted
  }
}
