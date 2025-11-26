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
import { useAuth } from '../../context/AuthContext'
import { useResources } from '../../hooks/useResources'
import { useNavigate, useParams } from 'react-router-dom'
import { useSignedUrls } from '../../hooks/useSignedUrls'
import { useSelector, useDispatch } from 'react-redux'
import { clearLastSectionInfo } from '../../redux/slices/courseSlice'
import { ChevronLeft, ChevronRight, OpenInNew } from '@mui/icons-material'
import { useGetStudentProgress, useUpdateProgress } from '../../hooks/useProgress'
import { postData } from '../../api/api'

const LearnerFrame = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const updateProgressMutation = useUpdateProgress()

  const { user } = useAuth()
  const { courseId, unitId, sectionId } = useParams()
  
  // Read isLastSection flag from Redux (persists across page refresh)
  const { lastSectionInfo } = useSelector(state => state.course)
  const isLastSection = lastSectionInfo?.unitId === unitId && 
                        lastSectionInfo?.sectionId === sectionId && 
                        lastSectionInfo?.isLastSection === true

  // Clear Redux state if sectionId doesn't match (user navigated to different section)
  useEffect(() => {
    if (lastSectionInfo?.sectionId && lastSectionInfo.sectionId !== sectionId) {
      dispatch(clearLastSectionInfo())
    }
  }, [sectionId, lastSectionInfo?.sectionId, dispatch])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showSectionCompletion, setShowSectionCompletion] = useState(false)
  const [recordedViews, setRecordedViews] = useState(new Set())

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
    refetch: refetchProgress
  } = useGetStudentProgress(user?.studentId, courseId, unitId, sectionId)

  const isResourceViewed = (resourceId) => {
    if (!progress?.viewedResources) return false
    return progress.viewedResources.some(vr => vr.resourceId === resourceId)
  }

  useEffect(() => {
    if (!currentResource || !user?.studentId || progressLoading) return

    const resourceId = currentResource._id
    const resourceType = currentResource.resourceType
    const isViewed = isResourceViewed(resourceId)
    const alreadyRecorded = recordedViews.has(resourceId)

    // Only record view for non-MCQ resources that haven't been viewed and not already recorded
    if (resourceType !== 'MCQ' && !isViewed && !alreadyRecorded) {
      setRecordedViews(prev => new Set(prev).add(resourceId))

      updateProgressMutation.mutate({
        resourceId,
        resourceNumber: currentResource.number,
        studentId: user.studentId,
        courseId,
        unitId,
        sectionId
      }, {
        onSuccess: () => {
          refetchProgress()
          if (currentIndex === resources.length - 1) {
            setShowSectionCompletion(true)
          }
        },
        onError: (error) => {
          console.error('Error recording view:', error)
          // Remove from recordedViews on error so it can be retried
          setRecordedViews(prev => {
            const newSet = new Set(prev)
            newSet.delete(resourceId)
            return newSet
          })
        }
      })
    }
  }, [currentResource?._id, progress?.viewedResources, progressLoading])

  useEffect(() => {
    if (!progress?.lastAccessedResource || currentIndex !== 0 || !resources.length || progressLoading) return

    const lastAccessedResourceId = progress.lastAccessedResource
    const resourceIndex = resources.findIndex(resource => resource._id === lastAccessedResourceId)

    if (resourceIndex !== -1 && resourceIndex !== currentIndex) {
      setCurrentIndex(resourceIndex)
    }
  }, [progress?.lastAccessedResource, resources, progressLoading, currentIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshExpiredUrls()
    }, 45 * 60 * 1000) // 45 minutes

    return () => {
      clearInterval(interval)
    }
  }, [refreshExpiredUrls])

  const handleMcqCompleted = async (resourceId, isCorrect, attempts) => {
    if (!user?.studentId || !isCorrect) return

    const isViewed = isResourceViewed(resourceId)

    if (!isViewed) {
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
          if (currentIndex === resources.length - 1) {
            setShowSectionCompletion(true)
          }
        },
        onError: (error) => {
          console.error('Error recording MCQ progress:', error)
        }
      })
    } else {
      if (currentIndex === resources.length - 1) {
        setShowSectionCompletion(true)
      }
    }
  }

  const handleNext = async () => {
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
    } else {
      // We're at the last resource - show completion component instead of navigating
      setShowSectionCompletion(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
    }
  }

  const handleSectionCompletion = async () => {
    setIsCompleting(true)
    try {
      // Call the unlock API to update progress
      const response = await postData('course-unlock/check-completion', {
        studentId: user.studentId,
        courseId,
        unitId,
        sectionId,
        isLastSection: isLastSection  // Pass flag to backend for verification
      })
      if (response.status === 200) {
        console.log('✅ Unlock status updated successfully')
        if (isLastSection) {
          console.log('✅ Last section flag sent - Backend will verify and mark unit as completed')
          // Clear Redux state after successful completion
          dispatch(clearLastSectionInfo())
        }

        // Navigate back to section view
        navigate(`/units/${courseId}/section/${unitId}`, {
          state: {
            refresh: true,
            completedSectionId: sectionId
          }
        })
      }
    } catch (error) {
      console.error('Error completing section:', error)
    } finally {
      setIsCompleting(false)
    }
  }

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
              onClick={() => {
                navigate(`/units/${courseId}/section/${unitId}`)
              }}
            >
              <ChevronLeft sx={{ color: 'primary.main' }} /> Back To Section
            </Typography>

            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              Section Progress: {Math.round(progress?.resourceProgressPercentage || 0)}%
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: progress?.resourceProgressPercentage === 100 ? 'success.main' : 'primary.main',
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
                    disabled={showSectionCompletion}
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
                    disabled={progress?.resourceProgressPercentage !== 100 &&
                      currentResource?.resourceType === 'MCQ'}
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
          </Box>

          <Box sx={{ bgcolor: 'white' }}>
            {!showSectionCompletion ? (
              <ResourceRenderer
                key={`resource-${currentResource._id}-${currentIndex}`}
                resource={currentResource}
                signedUrl={signedUrls[currentResource.content?.fileName]}
                signedUrls={signedUrls}
                onMcqCompleted={handleMcqCompleted}
                mcqProgress={progress?.mcqProgress?.find(mcq => mcq.resourceId === currentResource._id)}
                onNext={handleNext}
                isLastResource={currentIndex === resources.length - 1}
                studentId={user?.studentId}
                courseId={courseId}
                unitId={unitId}
                sectionId={sectionId}
              />
            ) : (
              <Box sx={{
                p: 4,
                textAlign: 'center',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: 'background.default'
              }}>
                <Typography variant="h5" sx={{ mb: 2, color: 'text.primary' }}>
                  🎉 Congratulations!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                  You have completed all resources in this section.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSectionCompletion}
                    disabled={isCompleting}
                    sx={{
                      minWidth: '200px',
                      height: '50px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      borderRadius: '25px',
                      textTransform: 'none',
                      bgcolor: 'success.main',
                      '&:hover': {
                        bgcolor: 'success.dark',
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'action.disabled',
                        color: 'action.disabled'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isCompleting ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        Completing...
                      </>
                    ) : (
                      'Complete Section'
                    )}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ px: 2, py: 2, borderTop: '1px solid #f0f0f0' }}>
            {progress?.mcqProgressPercentage > 0 && (
              <>
                <Typography variant='body2' fontWeight="medium">
                  MCQ Progress: {Math.round(progress?.mcqProgressPercentage || 0)}%
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={Math.round(progress?.mcqProgressPercentage || 0)}
                  sx={{
                    mt: 1,
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'success.main',
                      borderRadius: 4
                    }
                  }}
                />
              </>
            )}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default LearnerFrame