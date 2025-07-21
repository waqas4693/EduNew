import Grid from '@mui/material/Grid2'
import ResourceRenderer from './ResourceRenderer'
import {
  Box,
  Link,
  Paper,
  Button,
  Typography,
  LinearProgress,
  CircularProgress
} from '@mui/material'
import { useState, useEffect } from 'react'
import { getData, postData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import { useResources } from '../../hooks/useResources'
import { useNavigate, useParams } from 'react-router-dom'
import { useSignedUrls } from '../../hooks/useSignedUrls'
import { useProgress, useUpdateProgress } from '../../hooks/useProgress'
import { ChevronLeft, ChevronRight, OpenInNew } from '@mui/icons-material'

const LearnerFrame = () => {  
  const navigate = useNavigate()

  const { user } = useAuth()
  const { courseId, unitId, sectionId } = useParams()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCompleting, setIsCompleting] = useState(false)

  // Use our new hooks
  const {
    resources,
    isLoading: resourcesLoading,
    isError: resourcesError,
    prefetchNextPage,
    hasMore
  } = useResources(sectionId, currentPage)

  // Only use useSignedUrls when we have a current resource
  const currentResource = resources[currentIndex]
  const { signedUrls, isLoading: urlsLoading, refreshExpiredUrls } = useSignedUrls(
    currentResource || { content: {} }
  )

  const {
    progress,
    isLoading: progressLoading,
    getMcqProgress,
    isResourceCompleted,
    refetch: refetchProgress
  } = useProgress(user?.studentId, courseId, unitId, sectionId)

  const updateProgressMutation = useUpdateProgress()

  // Fetch student progress and navigate to last accessed resource
  useEffect(() => {
    const fetchStudentProgress = async () => {
      if (!user?.studentId || !resources.length) {        
        return
      }

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
              // The lastAccessedResource is the one that was recorded as viewed
              // So we should navigate to the NEXT resource after it
              const nextIndex = lastAccessedIndex + 1 < resources.length ? lastAccessedIndex + 1 : lastAccessedIndex
              setCurrentIndex(nextIndex)
            }
          }
        }
      } catch (error) {
        console.error('=== Error fetching student progress ===')
        console.error('Error details:', error)
      }
    }

    // Only fetch progress on initial load
    if (resources.length > 0 && currentIndex === 0) {
      console.log('Triggering initial progress fetch')
      fetchStudentProgress()
    }
  }, [user?.studentId, courseId, unitId, sectionId, resources.length, isResourceCompleted])

  // Handle MCQ completion
  const handleMcqCompleted = async (resourceId, isCorrect, attempts) => {
    if (!user?.studentId || !isCorrect) {      
      return
    }
    // Prevent duplicate MCQ progress submissions
    const alreadyAttempted = progress.mcqProgress?.some(
      (entry) => entry.resourceId === resourceId
    )
    if (alreadyAttempted) {
      // Optionally show a message or just silently return
      return
    }
    
    updateProgressMutation.mutate({
      resourceId,
      resourceNumber: currentResource.number,
      studentId: user.studentId,
      courseId,
      unitId,
      sectionId,
      mcqData: {
        completed: isCorrect,
        attempts
      }
    }, {
      onSuccess: () => {
        refetchProgress()
      },
      onError: (error) => {
        console.error('Error updating MCQ progress:', error)
      }
    })
  }

  // Handle navigation
  const handleNext = async () => {
    // Always record view for current resource first
    if (currentResource) {
      await updateProgressMutation.mutateAsync({
        resourceId: currentResource._id,
        resourceNumber: currentResource.number,
        studentId: user?.studentId,
        courseId,
        unitId,
        sectionId
      })
    }

    if (currentIndex < resources.length - 1) {
      const nextIndex = currentIndex + 1
      
      // Prefetch next page if needed (do this before navigation)
      if (nextIndex >= resources.length - 5 && hasMore) {
        try {
          setCurrentPage(prev => prev + 1)
          // Add timeout to prevent infinite loading
          const prefetchPromise = prefetchNextPage()
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Prefetch timeout')), 5000)
          )
          
          await Promise.race([prefetchPromise, timeoutPromise])
        } catch (error) {
          console.error('Error prefetching next page:', error)
          // Continue with navigation even if prefetch fails
        }
      }
      
      setCurrentIndex(nextIndex)
      
      // Refetch progress after recording the view
      refetchProgress()
    } else {
      // We're at the last resource of the section
      setIsCompleting(true)
      try {
        // Then check section completion
        const response = await postData('section-unlock/check-completion', {
          studentId: user?.studentId,
          courseId,
          unitId,
          sectionId
        })

        if (response.status === 200 && response.data.isCompleted) {          
          navigate(`/units/${courseId}/section/${unitId}`, {
            state: { 
              refresh: true,
              completedSectionId: sectionId 
            }
          })
        } else {
          console.log('Section not yet completed')
        }
      } catch (error) {
        console.error('=== Error completing section ===')
        console.error('Error details:', error)
      } finally {
        setIsCompleting(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
    } else {
      console.log('Already at first resource, cannot go previous')
    }
  }

  // Check if current MCQ is completed
  const isCurrentMcqCompleted = () => {
    if (!currentResource || currentResource.resourceType !== 'MCQ') {
      return true
    }
    const completed = isResourceCompleted(currentResource._id)
    console.log('Current MCQ completion status:', { 
      resourceId: currentResource._id, 
      completed 
    })
    return completed
  }

  // Check if next button should be disabled
  const isNextButtonDisabled = () => {
    if (currentIndex === resources.length - 1) {
      console.log('Next button enabled (last resource)')
      return false // Don't disable on last resource
    }
    if (currentResource?.resourceType === 'MCQ') {
      const disabled = !isCurrentMcqCompleted()
      console.log('Next button MCQ state:', { disabled })
      return disabled
    }
    console.log('Next button enabled (non-MCQ resource)')
    return false
  }

  // Get button text based on resource type and position
  const getNextButtonText = () => {
    if (currentIndex === resources.length - 1) {
      return 'Complete Section'
    }
    return <ChevronRight />
  }

  // Refresh expired URLs periodically
  useEffect(() => {
    console.log('Setting up URL refresh interval (45 minutes)')
    const interval = setInterval(() => {
      console.log('Refreshing expired URLs')
      refreshExpiredUrls()
    }, 45 * 60 * 1000) // 45 minutes

    return () => {
      console.log('Clearing URL refresh interval')
      clearInterval(interval)
    }
  }, [refreshExpiredUrls])

  // Show loading state if any data is loading or if we don't have resources yet
  if (resourcesLoading || urlsLoading || progressLoading || !resources.length) {
    console.log('=== Rendering Loading State ===')
    console.log('Loading states:', { 
      resourcesLoading, 
      urlsLoading, 
      progressLoading, 
      hasResources: !!resources.length,
      resourcesCount: resources.length,
      currentIndex,
      hasMore
    })
    
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
    console.log('=== No Current Resource ===')
    console.log('Resources available:', resources.length)
    
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

  console.log('=== Rendering LearnerFrame ===')
  console.log('Final render state:', {
    currentIndex,
    currentResource: currentResource.name,
    isCompleting,
    progress: { section: progress.section, mcq: progress.mcq }
  })

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
              onClick={() => {
                console.log('Navigating back to section')
                navigate(`/units/${courseId}/section/${unitId}`)
              }}
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

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* External Links */}
                {currentResource.content?.externalLinks?.filter(link => link.name && link.url).map((link, index) => {
                  console.log('Rendering external link:', link) // Debug log for each link
                  return (
                    <Link
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'white',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      <OpenInNew sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">
                        {link.name}
                      </Typography>
                    </Link>
                  )
                })}

                {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant='contained'
                  color='inherit'
                  size='small'
                  disabled={currentIndex === 0 || isCompleting}
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
                  disabled={isNextButtonDisabled() || isCompleting}
                  onClick={handleNext}
                  sx={{
                    minWidth: currentIndex === resources.length - 1 ? '120px' : '36px',
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
                  {isCompleting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    getNextButtonText()
                  )}
                </Button>
                </Box>
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
                Your Progress (MCQs): {Math.round(progress.mcq)}%
              </Typography>
              <Typography variant='body2' color="text.secondary">
                {progress.completedMcqs} of {progress.totalMcqs} MCQs completed
              </Typography>
            </Box>
            <LinearProgress 
              variant='determinate' 
              value={Math.round(progress.mcq)} 
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