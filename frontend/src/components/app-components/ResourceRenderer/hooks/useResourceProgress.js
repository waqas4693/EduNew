import { useState, useEffect } from 'react'
import { getData, postData } from '../../../../api/api'

const useResourceProgress = (studentId, courseId, unitId, sectionId) => {
  console.log('=== useResourceProgress Hook Initialized ===')
  console.log('Parameters:', { studentId, courseId, unitId, sectionId })
  
  const [progress, setProgress] = useState({
    section: 0,
    mcq: 0,
    totalMcqs: 0,
    completedMcqs: 0,
    studentProgress: null
  })
  const [loading, setLoading] = useState(false)

  console.log('Initial progress state:', progress)

  const fetchProgress = async () => {
    console.log('=== fetchProgress Called ===')
    console.log('Fetch parameters:', { studentId, courseId, unitId, sectionId })
    
    if (!studentId) {
      console.log('No student ID provided, skipping progress fetch')
      return
    }

    console.log('Setting loading state to true')
    setLoading(true)
    
    try {
      console.log('Making API call to fetch progress')
      const response = await getData(
        `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}`
      )
      console.log('Progress API response status:', response.status)
      
      if (response.status === 200) {
        const progressData = response.data.data
        console.log('Progress data received:', progressData)
        
        const newProgress = {
          section: progressData.sectionProgress || 0,
          mcq: progressData.mcqProgressPercentage || 0,
          totalMcqs: progressData.totalMcqs || 0,
          completedMcqs: progressData.completedMcqs || 0,
          studentProgress: progressData.progress
        }
        
        console.log('Setting new progress state:', newProgress)
        setProgress(newProgress)
      } else {
        console.warn('Unexpected response status:', response.status)
      }
    } catch (error) {
      console.error('=== Error fetching progress ===')
      console.error('Error details:', error)
    } finally {
      console.log('Setting loading state to false')
      setLoading(false)
    }
  }

  const updateMcqProgress = async (resourceId, isCorrect, attempts) => {
    console.log('=== updateMcqProgress Called ===')
    console.log('Update parameters:', { resourceId, isCorrect, attempts })
    
    if (!studentId || !isCorrect) {
      console.log('Skipping MCQ progress update:', { 
        hasStudentId: !!studentId, 
        isCorrect 
      })
      return
    }

    try {
      console.log('Making API call to update MCQ progress')
      await postData(
        `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}/${resourceId}`,
        {
          completed: true,
          attempts
        }
      )
      console.log('MCQ progress updated successfully')
      
      console.log('Refreshing progress data')
      await fetchProgress()
    } catch (error) {
      console.error('=== Error updating MCQ progress ===')
      console.error('Error details:', error)
    }
  }

  const updateLastAccessedResource = async (resourceId) => {
    console.log('=== updateLastAccessedResource Called ===')
    console.log('Resource ID:', resourceId)
    
    if (!studentId) {
      console.log('No student ID provided, skipping last accessed update')
      return
    }

    try {
      console.log('Making API call to update last accessed resource')
      await postData(
        `student-progress/last-accessed/${studentId}/${courseId}/${unitId}/${sectionId}`,
        {
          resourceId
        }
      )
      console.log('Last accessed resource updated successfully')
    } catch (error) {
      console.error('=== Error updating last accessed resource ===')
      console.error('Error details:', error)
    }
  }

  const recordResourceView = async (resourceId) => {
    console.log('=== recordResourceView Called ===')
    console.log('Resource ID:', resourceId)
    
    if (!studentId) {
      console.log('No student ID provided, skipping resource view recording')
      return
    }

    try {
      console.log('Making API call to record resource view')
      await postData('resource-views/record', {
        studentId,
        resourceId,
        courseId,
        unitId,
        sectionId
      })
      console.log('Resource view recorded successfully')
    } catch (error) {
      console.error('=== Error recording resource view ===')
      console.error('Error details:', error)
    }
  }

  useEffect(() => {
    console.log('=== useResourceProgress useEffect ===')
    console.log('Dependencies changed, fetching progress')
    fetchProgress()
  }, [studentId, courseId, unitId, sectionId])

  console.log('=== useResourceProgress Hook Return ===')
  console.log('Current progress:', progress)
  console.log('Loading state:', loading)
  
  return {
    progress,
    loading,
    actions: {
      updateMcqProgress,
      updateLastAccessedResource,
      recordResourceView,
      refreshProgress: fetchProgress
    }
  }
}

export default useResourceProgress 