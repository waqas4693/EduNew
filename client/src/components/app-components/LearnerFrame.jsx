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
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useResources } from '../../hooks/useResources'
import { useNavigate, useParams } from 'react-router-dom'
import { useSignedUrls } from '../../hooks/useSignedUrls'
import { ChevronLeft, ChevronRight, OpenInNew } from '@mui/icons-material'
import { useGetStudentProgress, useUpdateProgress } from '../../hooks/useProgress'
import { postData } from '../../api/api'
import { useQueryClient } from '@tanstack/react-query'

const LearnerFrame = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const updateProgressMutation = useUpdateProgress()

  const { user } = useAuth()
  const { courseId, unitId, sectionId } = useParams()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showSectionCompletion, setShowSectionCompletion] = useState(false)
  const [recordedViews, setRecordedViews] = useState(new Set())
  const [unlockError, setUnlockError] = useState(null)
  const [unlockSucceeded, setUnlockSucceeded] = useState(false)

  const unlockInFlightRef = useRef(false)

  const {
    resources,
    isLoading: resourcesLoading,
    isError: resourcesError,
    prefetchNextPage,
    hasMore
  } = useResources(sectionId, currentPage)

  const currentResource = resources[currentIndex]
  const { signedUrls, isLoading: urlsLoading, refreshExpiredUrls } = useSignedUrls(
    currentResource || { content: {} }
  )

  const {
    progress,
    isLoading: progressLoading,
    refetch: refetchProgress
  } = useGetStudentProgress(user?.studentId, courseId, unitId, sectionId)

  const isAtLastLoadedResource =
    resources.length > 0 && currentIndex === resources.length - 1 && !hasMore

  const isResourceViewed = (resourceId) => {
    if (!progress?.viewedResources) return false
    return progress.viewedResources.some(
      (vr) => String(vr.resourceId) === String(resourceId)
    )
  }

  const isMcqCompleted = (resourceId) => {
    if (!progress?.mcqProgress) return false
    return progress.mcqProgress.some(
      (mcq) => String(mcq.resourceId) === String(resourceId) && mcq.completed === true
    )
  }

  const areAllLoadedResourcesComplete = useCallback((progressSnapshot = progress) => {
    if (!resources.length || hasMore || !progressSnapshot) return false

    return resources.every((resource) => {
      const resourceId = resource._id
      if (resource.resourceType === 'MCQ') {
        return (progressSnapshot.mcqProgress || []).some(
          (mcq) => String(mcq.resourceId) === String(resourceId) && mcq.completed === true
        )
      }

      return (progressSnapshot.viewedResources || []).some(
        (vr) => String(vr.resourceId) === String(resourceId)
      )
    })
  }, [resources, hasMore, progress])

  const invalidateUnlockQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['unlockStatus', user?.studentId, courseId] }),
      queryClient.invalidateQueries({
        queryKey: ['unlockedSections', user?.studentId, courseId]
      }),
      queryClient.invalidateQueries({
        queryKey: ['completedUnits', user?.studentId, courseId]
      })
    ])
  }, [queryClient, user?.studentId, courseId])

  const unlockSection = useCallback(async ({ navigateAfter = false } = {}) => {
    if (!user?.studentId || unlockSucceeded) {
      if (navigateAfter) {
        navigate(`/units/${courseId}/section/${unitId}`, {
          state: { refresh: true, completedSectionId: sectionId }
        })
      }
      return true
    }

    if (unlockInFlightRef.current) {
      return false
    }

    unlockInFlightRef.current = true
    setUnlockError(null)

    try {
      const response = await postData('course-unlock/check-completion', {
        studentId: user.studentId,
        courseId,
        unitId,
        sectionId
      })

      if (response.status === 200 && response.data?.success) {
        setUnlockSucceeded(true)
        await invalidateUnlockQueries()

        if (navigateAfter) {
          navigate(`/units/${courseId}/section/${unitId}`, {
            state: { refresh: true, completedSectionId: sectionId }
          })
        }
        return true
      }

      setUnlockError(response.data?.message || 'Unable to unlock the next section')
      return false
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Unable to unlock the next section'
      setUnlockError(message)
      console.error('Error completing section:', error)
      return false
    } finally {
      unlockInFlightRef.current = false
    }
  }, [
    user?.studentId,
    courseId,
    unitId,
    sectionId,
    navigate,
    invalidateUnlockQueries,
    unlockSucceeded
  ])

  const maybeShowCompletionAndUnlock = useCallback(async (progressSnapshot) => {
    if (!isAtLastLoadedResource) return
    if (!areAllLoadedResourcesComplete(progressSnapshot)) return

    setShowSectionCompletion(true)
    await unlockSection({ navigateAfter: false })
  }, [isAtLastLoadedResource, areAllLoadedResourcesComplete, unlockSection])

  useEffect(() => {
    if (!currentResource || !user?.studentId || progressLoading) return

    const resourceId = currentResource._id
    const resourceType = currentResource.resourceType
    const isViewed = isResourceViewed(resourceId)
    const alreadyRecorded = recordedViews.has(resourceId)

    if (resourceType !== 'MCQ' && !isViewed && !alreadyRecorded) {
      setRecordedViews((prev) => new Set(prev).add(resourceId))

      updateProgressMutation.mutate(
        {
          resourceId,
          resourceNumber: currentResource.number,
          studentId: user.studentId,
          courseId,
          unitId,
          sectionId
        },
        {
          onSuccess: async (data) => {
            await refetchProgress()
            await maybeShowCompletionAndUnlock(data?.progress)
          },
          onError: (error) => {
            console.error('Error recording view:', error)
            setRecordedViews((prev) => {
              const next = new Set(prev)
              next.delete(resourceId)
              return next
            })
          }
        }
      )
    } else if (
      resourceType !== 'MCQ' &&
      isViewed &&
      isAtLastLoadedResource &&
      !showSectionCompletion
    ) {
      maybeShowCompletionAndUnlock(progress)
    }
  }, [
    currentResource?._id,
    progress?.viewedResources,
    progressLoading,
    isAtLastLoadedResource,
    showSectionCompletion
  ])

  useEffect(() => {
    if (!progress?.lastAccessedResource || currentIndex !== 0 || !resources.length || progressLoading) {
      return
    }

    const lastAccessedResourceId = progress.lastAccessedResource
    const resourceIndex = resources.findIndex(
      (resource) => String(resource._id) === String(lastAccessedResourceId)
    )

    if (resourceIndex !== -1 && resourceIndex !== currentIndex) {
      setCurrentIndex(resourceIndex)
    }
  }, [progress?.lastAccessedResource, resources, progressLoading, currentIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshExpiredUrls()
    }, 45 * 60 * 1000)

    return () => {
      clearInterval(interval)
    }
  }, [refreshExpiredUrls])

  // Reset unlock flags when switching sections
  useEffect(() => {
    unlockInFlightRef.current = false
    setUnlockSucceeded(false)
    setShowSectionCompletion(false)
    setUnlockError(null)
    setRecordedViews(new Set())
    setCurrentIndex(0)
    setCurrentPage(1)
  }, [sectionId])

  const handleMcqCompleted = async (resourceId, isCorrect, attempts) => {
    if (!user?.studentId || !isCorrect) return

    const alreadyCompleted = isMcqCompleted(resourceId)

    if (!alreadyCompleted) {
      updateProgressMutation.mutate(
        {
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
        },
        {
          onSuccess: async (data) => {
            await refetchProgress()
            await maybeShowCompletionAndUnlock(data?.progress)
          },
          onError: (error) => {
            console.error('Error recording MCQ progress:', error)
          }
        }
      )
    } else if (isAtLastLoadedResource) {
      await maybeShowCompletionAndUnlock(progress)
    }
  }

  const handleNext = async () => {
    if (currentIndex < resources.length - 1) {
      const nextIndex = currentIndex + 1

      if (nextIndex >= resources.length - 5 && hasMore) {
        try {
          setCurrentPage((prev) => prev + 1)
          const prefetchPromise = prefetchNextPage()
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Prefetch timeout')), 5000)
          )
          await Promise.race([prefetchPromise, timeoutPromise])
        } catch (error) {
          console.error('Error prefetching next page:', error)
        }
      }

      setCurrentIndex(nextIndex)
      return
    }

    if (hasMore) {
      try {
        setCurrentPage((prev) => prev + 1)
        await prefetchNextPage()
        setCurrentIndex((prev) => prev + 1)
      } catch (error) {
        console.error('Error loading next page of resources:', error)
      }
      return
    }

    await maybeShowCompletionAndUnlock(progress)
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleSectionCompletion = async () => {
    setIsCompleting(true)
    try {
      await unlockSection({ navigateAfter: true })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleBackToSection = async () => {
    // If materials look complete, unlock before leaving so the next section opens
    if (showSectionCompletion || unlockSucceeded || areAllLoadedResourcesComplete()) {
      setIsCompleting(true)
      try {
        const unlocked = await unlockSection({ navigateAfter: true })
        if (unlocked) return
      } finally {
        setIsCompleting(false)
      }
    }

    navigate(`/units/${courseId}/section/${unitId}`)
  }

  if (resourcesLoading || urlsLoading || progressLoading) {
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
          size={56}
          thickness={3.5}
          sx={{
            color: 'primary.main',
            mb: 2
          }}
        />
        <Typography variant='h6' color="text.secondary">
          Loading learning materials…
        </Typography>
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

  if (!resources.length) {
    return (
      <Paper
        elevation={5}
        sx={{
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          width: '100%',
          bgcolor: 'background.paper',
          flexDirection: 'column',
          p: 4,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
          No materials in this section yet
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
          There are no learning resources to show right now. Please check back later or contact your administrator.
        </Typography>
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
                cursor: isCompleting ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                opacity: isCompleting ? 0.6 : 1
              }}
              onClick={() => {
                if (!isCompleting) handleBackToSection()
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
                    disabled={currentResource?.resourceType === 'MCQ' &&
                      !isMcqCompleted(currentResource._id)}
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
                mcqProgress={progress?.mcqProgress?.find(
                  (mcq) => String(mcq.resourceId) === String(currentResource._id)
                )}
                onNext={handleNext}
                isLastResource={isAtLastLoadedResource}
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
                <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                  You have completed all resources in this section.
                </Typography>

                {unlockError && (
                  <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                    {unlockError}. Please try again.
                  </Typography>
                )}

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
                    ) : unlockSucceeded ? (
                      'Continue'
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
