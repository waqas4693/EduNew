import { useState, useEffect } from 'react'
import { getData } from '../api/api'

// Hook to get unit progress for a course
export const useUnitProgress = (studentId, courseId) => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUnitProgress = async () => {
      if (!studentId || !courseId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await getData(`progress/unit/${studentId}/${courseId}`)
        
        if (response.status === 200) {
          setData(response.data.data || [])
        } else {
          setError('Failed to fetch unit progress')
        }
      } catch (err) {
        console.error('Error fetching unit progress:', err)
        setError(err.message || 'Failed to fetch unit progress')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnitProgress()
  }, [studentId, courseId])

  return { data, isLoading, error }
}

// Hook to get course progress
export const useCourseProgress = (studentId, courseId) => {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!studentId || !courseId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await getData(`progress/course/${studentId}/${courseId}`)
        
        if (response.status === 200) {
          setData(response.data.data)
        } else {
          setError('Failed to fetch course progress')
        }
      } catch (err) {
        console.error('Error fetching course progress:', err)
        setError(err.message || 'Failed to fetch course progress')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseProgress()
  }, [studentId, courseId])

  return { data, isLoading, error }
}

// Hook to get all course progress for a student (for dashboard)
export const useAllCourseProgress = (studentId) => {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAllCourseProgress = async () => {
      if (!studentId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await getData(`progress/all-courses/${studentId}`)
        
        if (response.status === 200) {
          setData(response.data.data || [])
        } else {
          setError('Failed to fetch all course progress')
        }
      } catch (err) {
        console.error('Error fetching all course progress:', err)
        setError(err.message || 'Failed to fetch all course progress')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllCourseProgress()
  }, [studentId])

  return { data, isLoading, error }
} 