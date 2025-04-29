import Grid from '@mui/material/Grid2'
import ResourceRenderer from './ResourceRenderer'
import {
  Box,
  Typography,
  Paper,  
  Button,
  CircularProgress,
  LinearProgress
} from '@mui/material'

import { useState, useEffect } from 'react'
import { getData, postData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import { useProgress } from '../../hooks/useProgress'
import { useNavigate, useParams } from 'react-router-dom'
import { useSignedUrls } from '../../hooks/useSignedUrls'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { useResources, useUpdateResourceProgress, useRecordResourceView } from '../../hooks/useResources'

const LearnerFrame = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const navigate = useNavigate()
  const { courseId, unitId, sectionId } = useParams()
  const { user } = useAuth()

  // Use our new hooks
  const {
    resources,
    isLoading: resourcesLoading,
    isError: resourcesError,
    prefetchNextPage
  } = useResources(sectionId)

  // Only use useSignedUrls when we have a current resource
  const currentResource = resources[currentIndex]
  const { signedUrls, isLoading: urlsLoading, refreshExpiredUrls } = useSignedUrls(
    currentResource || { content: {} }
  )

  const {
    progress,
    isLoading: progressLoading,
    updateProgress,
    getMcqProgress,
    isResourceCompleted
  } = useProgress(user?.studentId, courseId, unitId, sectionId)

  const updateResourceProgress = useUpdateResourceProgress()
  const recordResourceView = useRecordResourceView()

  // Fetch student progress and navigate to last accessed resource
  useEffect(() => {
    const fetchStudentProgress = async () => {
      if (!user?.studentId || !resources.length) return

      try {
        const response = await getData(`student-progress/${user.studentId}/${courseId}/${unitId}/${sectionId}`)
        if (response.status === 200) {
          const progressData = response.data.data.progress
          
          if (progressData?.lastAccessedResource) {
            // Find the index of the last accessed resource
            const lastAccessedIndex = resources.findIndex(
              resource => resource._id === progressData.lastAccessedResource
            )
            
            if (lastAccessedIndex !== -1) {
              setCurrentIndex(lastAccessedIndex)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching student progress:', error)
      }
    }

    if (resources.length > 0) {
      fetchStudentProgress()
    }
  }, [user?.studentId, courseId, unitId, sectionId, resources])

  // Update last accessed resource when current resource changes
  useEffect(() => {
    const updateLastAccessed = async () => {
      if (!user?.studentId || !currentResource) return

      try {
        await postData(`student-progress/last-accessed/${user.studentId}/${courseId}/${unitId}/${sectionId}`, {
          resourceId: currentResource._id
        })
      } catch (error) {
        console.error('Error updating last accessed resource:', error)
      }
    }

    updateLastAccessed()
  }, [currentIndex, currentResource, user?.studentId, courseId, unitId, sectionId])

  // Handle navigation
  const handleNext = async () => {
    if (currentIndex < resources.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      
      // Prefetch next page if needed
      if (nextIndex >= resources.length - 5) {
        prefetchNextPage()
      }
      
      // Record view and update progress
      if (resources[nextIndex]) {
        recordResourceView.mutate({
          resourceId: resources[nextIndex]._id,
          courseId,
          unitId,
          sectionId
        })
      }
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      
      // Record view
      if (resources[prevIndex]) {
        recordResourceView.mutate({
          resourceId: resources[prevIndex]._id,
          courseId,
          unitId,
          sectionId
        })
      }
    }
  }

  // Handle MCQ completion
  const handleMcqCompleted = async (resourceId, isCorrect, attempts) => {
    if (!user?.studentId || !isCorrect) return

    updateResourceProgress.mutate({
      resourceId,
      isCorrect,
      attempts,
      studentId: user.studentId,
      courseId,
      unitId,
      sectionId
    })
  }

  // Check if current MCQ is completed
  const isCurrentMcqCompleted = () => {
    if (!currentResource || currentResource.resourceType !== 'MCQ') {
      return true
    }
    return isResourceCompleted(currentResource._id)
  }

  // Refresh expired URLs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshExpiredUrls()
    }, 45 * 60 * 1000) // 45 minutes

    return () => clearInterval(interval)
  }, [refreshExpiredUrls])

  // Show loading state if any data is loading or if we don't have resources yet
  if (resourcesLoading || urlsLoading || progressLoading || !resources.length) {
    return (
      <Paper
        elevation={5}
        sx={{
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          width: '100%',
          bgcolor: 'background.paper',
          flexDirection: 'column'
        }}
      >
        <CircularProgress
          size={180}
          thickness={3}
          sx={{
            color: 'primary.main',
            mb: 3
          }}
        />
        <Typography variant='h5'>Loading Learner's Frame</Typography>
      </Paper>
    )
  }

  if (resourcesError) {
    return (
      <Paper
        elevation={5}
        sx={{
          borderRadius: '16px',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Typography color="error">Error loading resources. Please try again.</Typography>
      </Paper>
    )
  }

  // Don't render if we don't have a current resource
  if (!currentResource) {
    return (
      <Paper
        elevation={5}
        sx={{
          borderRadius: '16px',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Typography color="error">No resources found.</Typography>
      </Paper>
    )
  }

  return (
    <Grid container>
      <Grid size={12}>
        <Paper elevation={5} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
          <Box sx={{ 
            p: 1, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Typography
              variant='body2'
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content'
              }}
              onClick={() => navigate(`/units/${courseId}/section/${unitId}`)}
            >
              <ChevronLeft sx={{ color: 'primary.main' }} /> Back To Section
            </Typography>
            
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              Section Viewed: {Math.round(progress.section)}%
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box
              sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant='h6' sx={{ mr: 1 }}>
                  {currentResource.name}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='contained'
                  color='inherit'
                  size='small'
                  disabled={currentIndex === 0}
                  onClick={handlePrevious}
                  sx={{
                    minWidth: '36px',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant='contained'
                  color='inherit'
                  size='small'
                  disabled={
                    currentIndex === resources.length - 1 ||
                    (currentResource.resourceType === 'MCQ' &&
                      !isCurrentMcqCompleted())
                  }
                  onClick={handleNext}
                  sx={{
                    minWidth: '36px',
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  <ChevronRight />
                </Button>
              </Box>
            </Box>
          </Box>

          <Box sx={{ bgcolor: 'white' }}>
              <ResourceRenderer
              key={`resource-${currentResource._id}-${currentIndex}`}
              resource={currentResource}
              signedUrl={signedUrls[currentResource.content?.fileName]}
                signedUrls={signedUrls}
                onMcqCompleted={handleMcqCompleted}
              mcqProgress={getMcqProgress(currentResource._id)}
                onNext={handleNext}
                isLastResource={currentIndex === resources.length - 1}
              studentId={user?.studentId}
              courseId={courseId}
              unitId={unitId}
              sectionId={sectionId}
              />
          </Box>

          <Box sx={{ px: 2, py: 2, borderTop: '1px solid #f0f0f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant='body2' fontWeight="medium">
                Your Progress (MCQs): {progress.mcq}%
              </Typography>
              <Typography variant='body2' color="text.secondary">
                {progress.completedMcqs} of {progress.totalMcqs} MCQs completed
              </Typography>
            </Box>
            <LinearProgress 
              variant='determinate' 
              value={progress.mcq} 
              sx={{ 
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': { 
                  backgroundColor: 'success.main',
                  borderRadius: 4
                } 
              }} 
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default LearnerFrame