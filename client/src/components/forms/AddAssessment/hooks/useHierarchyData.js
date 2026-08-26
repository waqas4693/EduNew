import { useState, useEffect, useCallback } from 'react'
import { getData } from '../../../../api/api'
import { calculateRemainingPercentage } from '../utils/assessmentHelpers'

/**
 * Custom hook for managing course hierarchy data (courses, units, sections)
 * and existing assessments
 */
export const useHierarchyData = () => {
  const [courseId, setCourseId] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [courses, setCourses] = useState([])
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState([])
  const [existingAssessments, setExistingAssessments] = useState([])
  const [remainingPercentage, setRemainingPercentage] = useState(100)

  const fetchCourses = useCallback(async () => {
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        setCourses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }, [])

  const fetchUnits = useCallback(async () => {
    if (!courseId) return
    
    try {
      const response = await getData(`units/${courseId}`)
      if (response.status === 200) {
        setUnits(response.data.units)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }, [courseId])

  const fetchSections = useCallback(async () => {
    if (!unitId) return
    
    try {
      const response = await getData(`sections/${unitId}`)
      if (response.status === 200) {
        setSections(response.data.sections)
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
    }
  }, [unitId])

  const fetchExistingAssessments = useCallback(async () => {
    if (!sectionId) return
    
    try {
      const response = await getData(`assessments/${sectionId}`)
      if (response.status === 200) {
        setExistingAssessments(response.data.assessments)
        setRemainingPercentage(calculateRemainingPercentage(response.data.assessments))
      }
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }, [sectionId])

  // Initial fetch
  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // Fetch units when course changes
  useEffect(() => {
    if (courseId) {
      fetchUnits()
      // Reset dependent selections
      setUnitId(null)
      setSectionId(null)
      setUnits([])
      setSections([])
    }
  }, [courseId, fetchUnits])

  // Fetch sections when unit changes
  useEffect(() => {
    if (unitId) {
      fetchSections()
      // Reset dependent selections
      setSectionId(null)
      setSections([])
    }
  }, [unitId, fetchSections])

  // Fetch assessments when section changes
  useEffect(() => {
    if (sectionId) {
      fetchExistingAssessments()
    }
  }, [sectionId, fetchExistingAssessments])

  return {
    courseId,
    unitId,
    sectionId,
    courses,
    units,
    sections,
    existingAssessments,
    remainingPercentage,
    setCourseId,
    setUnitId,
    setSectionId,
    fetchExistingAssessments
  }
}
