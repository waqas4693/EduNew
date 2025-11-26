import { useState, useEffect } from 'react'
import { getData, postData } from '../../../../api/api'

const useResourceProgress = (studentId, courseId, unitId, sectionId) => {
  
  const [progress, setProgress] = useState({
    section: 0,
    mcq: 0,
    totalMcqs: 0,
    completedMcqs: 0,
    studentProgress: null
  })
  const [loading, setLoading] = useState(false)


  const fetchProgress = async () => {

    
    if (!studentId) {
      return
    }

    setLoading(true)
    
    try {
      const response = await getData(
        `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}`
      )
      
      if (response.status === 200) {
        const progressData = response.data.data
        
        const newProgress = {
          section: progressData.sectionProgress || 0,
          mcq: progressData.mcqProgressPercentage || 0,
          totalMcqs: progressData.totalMcqs || 0,
          completedMcqs: progressData.completedMcqs || 0,
          studentProgress: progressData.progress
        }
        
        setProgress(newProgress)
      } else {
      }
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  const updateMcqProgress = async (resourceId, isCorrect, attempts) => {

    
    if (!studentId || !isCorrect) {
  
      return
    }

    try {
      await postData(
        `student-progress/${studentId}/${courseId}/${unitId}/${sectionId}/${resourceId}`,
        {
          completed: true,
          attempts
        }
      )
      
      await fetchProgress()
    } catch (error) {

    }
  }

  const updateLastAccessedResource = async (resourceId) => {

    
    if (!studentId) {
      return
    }

    try {
      await postData(
        `student-progress/last-accessed/${studentId}/${courseId}/${unitId}/${sectionId}`,
        {
          resourceId
        }
      )
    } catch (error) {
 
    }
  }

  const recordResourceView = async (resourceId) => {

    
    if (!studentId) {
      return
    }

    try {
      await postData('resource-views/record', {
        studentId,
        resourceId,
        courseId,
        unitId,
        sectionId
      })
    } catch (error) {

    }
  }

  useEffect(() => {

    fetchProgress()
  }, [studentId, courseId, unitId, sectionId])

  
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