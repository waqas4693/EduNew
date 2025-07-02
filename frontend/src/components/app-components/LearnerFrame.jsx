import Grid from '@mui/material/Grid2'
import ResourceRenderer from './ResourceRenderer'
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  LinearProgress,
  Link
} from '@mui/material'

import { useState, useEffect } from 'react'
import { getData, postData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import { useProgress, useUpdateProgress } from '../../hooks/useProgress'
import { useNavigate, useParams } from 'react-router-dom'
import { useSignedUrls } from '../../hooks/useSignedUrls'
import { ChevronLeft, ChevronRight, OpenInNew } from '@mui/icons-material'
import { useResources } from '../../hooks/useResources'

const LearnerFrame = () => {
  console.log('=== LearnerFrame Component Initialized ===')
  
  const navigate = useNavigate()

  const { user } = useAuth()
  const { courseId, unitId, sectionId } = useParams()

  console.log('Route params:', { courseId, unitId, sectionId })
  console.log('User context:', { studentId: user?.studentId, userId: user?.id })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCompleting, setIsCompleting] = useState(false)

  console.log('Initial state:', { currentIndex, currentPage, isCompleting })

  // Use our new hooks
  const {
    resources,
    isLoading: resourcesLoading,
    isError: resourcesError,
    prefetchNextPage,
    hasMore
  } = useResources(sectionId, currentPage)

  console.log('Resources hook state:', { 
    resourcesCount: resources.length, 
    isLoading: resourcesLoading, 
    isError: resourcesError, 
    hasMore 
  })

  // Only use useSignedUrls when we have a current resource
  const currentResource = resources[currentIndex]
  const { signedUrls, isLoading: urlsLoading, refreshExpiredUrls } = useSignedUrls(
    currentResource || { content: {} }
  )

  console.log('Current resource:', currentResource ? {
    id: currentResource._id,
    name: currentResource.name,
    type: currentResource.resourceType,
    number: currentResource.number
  } : null)

  console.log('Signed URLs state:', { 
    urlsCount: Object.keys(signedUrls).length, 
    isLoading: urlsLoading 
  })

  const {
    progress,
    isLoading: progressLoading,
    getMcqProgress,
    isResourceCompleted,
    refetch: refetchProgress
  } = useProgress(user?.studentId, courseId, unitId, sectionId)

  console.log('Progress state:', { 
    sectionProgress: progress.section, 
    mcqProgress: progress.mcq, 
    isLoading: progressLoading 
  })

  const updateProgressMutation = useUpdateProgress()

  // Fetch student progress and navigate to last accessed resource
  useEffect(() => {
    console.log('=== Fetching Student Progress ===')
    const fetchStudentProgress = async () => {
      if (!user?.studentId || !resources.length) {
        console.log('Skipping progress fetch:', { 
          hasStudentId: !!user?.studentId, 
          resourcesLength: resources.length 
        })
        return
      }

      try {
        console.log('Fetching progress for student:', user.studentId)
        const response = await getData(`student-progress/${user.studentId}/${courseId}/${unitId}/${sectionId}`)
        console.log('Progress response status:', response.status)
        
        if (response.status === 200) {
          const progressData = response.data.data.progress
          console.log('Progress data received:', progressData)
          
          if (progressData?.lastAccessedResource) {
            console.log('Last accessed resource found:', progressData.lastAccessedResource)
            // Find the index of the last accessed resource
            const lastAccessedIndex = resources.findIndex(
              resource => resource._id === progressData.lastAccessedResource
            )
            
            console.log('Last accessed resource index:', lastAccessedIndex)
            
            if (lastAccessedIndex !== -1) {
              // If the last accessed resource is an MCQ and not completed, stay on it
              const lastResource = resources[lastAccessedIndex]
              console.log('Last resource details:', {
                type: lastResource.resourceType,
                isCompleted: isResourceCompleted(lastResource._id)
              })
              
              if (lastResource.resourceType === 'MCQ' && !isResourceCompleted(lastResource._id)) {
                console.log('Setting current index to last accessed MCQ (not completed)')
                setCurrentIndex(lastAccessedIndex)
              } else {
                // If not an MCQ or already completed, move to the next resource
                const nextIndex = lastAccessedIndex + 1 < resources.length ? lastAccessedIndex + 1 : lastAccessedIndex
                console.log('Setting current index to next resource:', nextIndex)
                setCurrentIndex(nextIndex)
              }
            } else {
              console.log('Last accessed resource not found in current resources list')
            }
          } else {
            console.log('No last accessed resource found, starting from beginning')
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
    console.log('=== MCQ Completion Handler ===')
    console.log('MCQ completion details:', { resourceId, isCorrect, attempts })
    
    if (!user?.studentId || !isCorrect) {
      console.log('Skipping MCQ completion:', { 
        hasStudentId: !!user?.studentId, 
        isCorrect 
      })
      return
    }
    
    console.log('Updating progress for MCQ completion')
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
        console.log('MCQ progress updated successfully, refetching progress')
        refetchProgress()
      },
      onError: (error) => {
        console.error('Error updating MCQ progress:', error)
      }
    })
  }

  // Handle navigation
  const handleNext = async () => {
    console.log('=== Next Navigation Handler ===')
    console.log('Current state:', { currentIndex, resourcesLength: resources.length })
    
    if (currentIndex < resources.length - 1) {
      const nextIndex = currentIndex + 1
      console.log('Moving to next resource:', nextIndex)
      setCurrentIndex(nextIndex)
      
      // Prefetch next page if needed
      if (nextIndex >= resources.length - 5 && hasMore) {
        console.log('Prefetching next page of resources')
        setCurrentPage(prev => prev + 1)
        prefetchNextPage()
      }
      
      // Record view and update progress only when actually navigating
      if (resources[nextIndex]) {
        console.log('Recording view for next resource:', resources[nextIndex]._id)
        updateProgressMutation.mutate({
          resourceId: resources[nextIndex]._id,
          resourceNumber: resources[nextIndex].number,
          studentId: user?.studentId,
          courseId,
          unitId,
          sectionId
        }, {
          onSuccess: () => {
            console.log('Progress updated for next resource')
            refetchProgress()
          },
          onError: (error) => {
            console.error('Error updating progress for next resource:', error)
          }
        })
      }
    } else {
      // We're at the last resource of the section
      console.log('=== Section Completion Process Started ===')
      setIsCompleting(true)
      try {
        // First record the final view
        if (currentResource) {
          console.log('Recording final resource view before completion')
          await updateProgressMutation.mutateAsync({
            resourceId: currentResource._id,
            resourceNumber: currentResource.number,
            studentId: user?.studentId,
            courseId,
            unitId,
            sectionId
          })
        }

        // Then check section completion
        console.log('Checking section completion status')
        const response = await postData('section-unlock/check-completion', {
          studentId: user?.studentId,
          courseId,
          unitId,
          sectionId
        })

        console.log('Section completion response:', response.data)

        if (response.status === 200 && response.data.isCompleted) {
          console.log('Section completed successfully, navigating back')
          // Wait for progress to be updated
          await refetchProgress()
          
          // Navigate back to sections page with a state parameter to trigger refresh
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
        // Show error to user
        // You might want to add a proper error notification here
      } finally {
        console.log('Section completion process finished')
        setIsCompleting(false)
      }
    }
  }

  const handlePrevious = () => {
    console.log('=== Previous Navigation Handler ===')
    console.log('Current index:', currentIndex)
    
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      console.log('Moving to previous resource:', prevIndex)
      setCurrentIndex(prevIndex)
      
      // Record view only when actually navigating
      if (resources[prevIndex]) {
        console.log('Recording view for previous resource:', resources[prevIndex]._id)
        updateProgressMutation.mutate({
          resourceId: resources[prevIndex]._id,
          resourceNumber: resources[prevIndex].number,
          studentId: user?.studentId,
          courseId,
          unitId,
          sectionId
        }, {
          onSuccess: () => {
            console.log('Progress updated for previous resource')
            refetchProgress()
          },
          onError: (error) => {
            console.error('Error updating progress for previous resource:', error)
          }
        })
      }
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

  // Add console log to check current resource data
  useEffect(() => {
    if (currentResource) {
      console.log('=== Current Resource Updated ===')
      console.log('Current Resource:', currentResource)
      console.log('External Links:', currentResource.content?.externalLinks)
    }
  }, [currentResource])

  // Show loading state if any data is loading or if we don't have resources yet
  if (resourcesLoading || urlsLoading || progressLoading || !resources.length) {
    console.log('=== Rendering Loading State ===')
    console.log('Loading states:', { 
      resourcesLoading, 
      urlsLoading, 
      progressLoading, 
      hasResources: !!resources.length 
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
    console.error('=== Rendering Error State ===')
    console.error('Resources error:', resourcesError)
    
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