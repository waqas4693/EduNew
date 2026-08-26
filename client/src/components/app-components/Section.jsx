import {
  Box,
  Typography,
  Paper,
  Button,
  CardMedia,
  ListItem,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useMemo } from 'react'
import { useUnitDetails } from '../../hooks/useUnits'
import { useDispatch, useSelector } from 'react-redux'
import { useSectionProgress } from '../../hooks/useSectionProgress'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSections, useUnlockedSections } from '../../hooks/useSections'
import { setCurrentUnit } from '../../redux/slices/courseSlice'
import { useCompletedSections, useSyncCourseUnlock } from '../../hooks/useUnlockSync'

import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import MenuBook from '@mui/icons-material/MenuBook'
import CheckCircle from '@mui/icons-material/CheckCircle'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import LockOutlined from '@mui/icons-material/LockOutlined'
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined'
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'


const Section = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const { user } = useAuth()
  const { courseId, unitId } = useParams()
  const { currentCourse, currentUnit } = useSelector(state => state.course)

  const { data: unitDetails } = useUnitDetails(unitId)
  const { data: sections, isLoading: sectionsLoading, refetch } = useSections(unitId)
  const { data: unlockStatus, refetch: refetchUnlockedSections } = useUnlockedSections(user?.studentId, courseId, unitId)
  const { data: completedSections = [], refetch: refetchCompletedSections } = useCompletedSections(
    user?.studentId,
    courseId
  )
  const syncUnlock = useSyncCourseUnlock()
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [showRestrictionDialog, setShowRestrictionDialog] = useState(false)
  const [hasSynced, setHasSynced] = useState(false)

  const sectionIds = useMemo(() => {
    return sections?.map(section => section._id) || []
  }, [sections])

  const completedSectionIdSet = useMemo(() => {
    return new Set(
      (completedSections || [])
        .filter((row) => String(row.unitId) === String(unitId))
        .map((row) => String(row.sectionId))
    )
  }, [completedSections, unitId])
  
  const { isSectionCompleted: isSectionProgressComplete, isLoading: progressLoading } = useSectionProgress(
    user?.studentId, 
    courseId, 
    unitId, 
    sectionIds
  )

  const isSectionCompleted = (sectionId) => {
    return (
      completedSectionIdSet.has(String(sectionId)) ||
      isSectionProgressComplete(sectionId)
    )
  }

  useEffect(() => {
    if (unitDetails && (!currentUnit || currentUnit.id !== unitId)) {
      dispatch(setCurrentUnit({
        id: unitId,
        name: unitDetails.name
      }))
    }
  }, [unitDetails, unitId, dispatch])

  // Keep unlock watermark aligned with material progress in the database
  useEffect(() => {
    const runSync = async () => {
      if (!user?.studentId || !courseId || user?.isDemo || hasSynced) return
      try {
        await syncUnlock.mutateAsync({
          studentId: user.studentId,
          courseId
        })
        await Promise.all([
          refetchUnlockedSections(),
          refetchCompletedSections()
        ])
      } catch (error) {
        console.error('Error syncing section unlock status:', error)
      } finally {
        setHasSynced(true)
      }
    }

    runSync()
  }, [user?.studentId, courseId, user?.isDemo, hasSynced])

  useEffect(() => {
    const handleRefresh = async () => {
      if (location.state?.refresh) {
        try {
          await syncUnlock.mutateAsync({
            studentId: user.studentId,
            courseId
          })
          await refetch()
          await refetchUnlockedSections()
          await refetchCompletedSections()
          window.history.replaceState({}, document.title)
        } catch (error) {
          console.error('Error refreshing section data:', error)
        }
      }
    }

    handleRefresh()
  }, [location.state, refetch, refetchUnlockedSections])

  useEffect(() => {
    if (location.state?.completedSectionId) {
      const element = document.getElementById(`section-${location.state.completedSectionId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [location.state?.completedSectionId])

  const courseName = currentCourse?.name
  const courseImage = currentCourse?.image
  const unitName = currentUnit?.name

  const handleBackToUnit = () => {
    navigate(`/units/${courseId}`)
  }

  const isSectionUnlocked = (sectionId) => {
    if (user?.isDemo) return true

    const section = sections?.find((item) => String(item._id) === String(sectionId))
    if (!section) return false

    // No unlock pointer yet → only the first section of this unit
    if (!unlockStatus?.unlockedSection) {
      return sections?.[0] && String(sections[0]._id) === String(sectionId)
    }

    const unlockedSectionIndex = sections.findIndex(
      (item) => String(item._id) === String(unlockStatus.unlockedSection)
    )

    // Watermark is in another unit (usually a later one after repair/sync).
    // This unit is already behind that pointer → open all of its sections.
    // (Reverts the bad "only first section" rule that caused orange locks.)
    if (unlockedSectionIndex === -1) {
      const watermark = unlockStatus?.watermark
      const currentUnitNumber = unitDetails?.number

      if (watermark?.unitNumber != null && currentUnitNumber != null) {
        if (currentUnitNumber < watermark.unitNumber) return true
        if (currentUnitNumber === watermark.unitNumber + 1) {
          return sections?.[0] && String(sections[0]._id) === String(sectionId)
        }
        if (currentUnitNumber > watermark.unitNumber + 1) {
          const unlockedUnitNumber = unlockStatus?.unlockedUnitNumber
          if (unlockedUnitNumber != null && currentUnitNumber <= unlockedUnitNumber) {
            return true
          }
          if (unlockedUnitNumber != null && currentUnitNumber === unlockedUnitNumber + 1) {
            return sections?.[0] && String(sections[0]._id) === String(sectionId)
          }
          return false
        }
      }

      // Safe default when watermark metadata is missing from API:
      // pointer is not in this unit, so this unit has been passed.
      return true
    }

    // Watermark is inside this unit → unlock through completed section + next
    const currentSectionIndex = sections.findIndex(
      (item) => String(item._id) === String(sectionId)
    )
    return currentSectionIndex !== -1 && currentSectionIndex <= unlockedSectionIndex + 1
  }

  // Student can open a section if unlocked by watermark OR already completed in DB
  const canOpenSection = (sectionId) => {
    return isSectionUnlocked(sectionId) || isSectionCompleted(sectionId)
  }

  const isSectionAccessible = (sectionIndex) => {
    if (!user?.isDemo) return true
    return currentUnit?.isFirstUnit && sectionIndex === 0
  }

  const handleRestrictedClick = () => {
    setShowRestrictionDialog(true)
  }

  const handleSectionClick = (section, isUnlocked) => {
    if (!isSectionAccessible(sections.indexOf(section))) {
      handleRestrictedClick()
      return
    }
    if (isUnlocked) {
      navigate(
        `/units/${courseId}/section/${unitId}/learn/${section._id}`
      )
    }
  }

  const handleAssessmentClick = (section, isUnlocked) => {
    if (!isSectionAccessible(sections.indexOf(section))) {
      handleRestrictedClick()
      return
    }
    if (isUnlocked) {
      navigate(
        `/units/${courseId}/section/${unitId}/assessment/${section._id}`
      )
    }
  }

  if (isMobile) {
    // Mobile: Only section content, no calendar
    return (
      <Box>
        <Paper
          elevation={5}
          sx={{
            p: '24px 12px',
            borderRadius: '16px',
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography
              variant='body2'
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                gap: 0
              }}
              onClick={handleBackToUnit}
            >
              <ChevronLeft sx={{ ml: -1 }} /> Back To Unit
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CardMedia
              component='img'
              image={courseImage || '/background-images/1.jpg'}
              alt='Course Image'
              sx={{
                width: 100,
                height: 100,
                borderRadius: '8px',
                mr: 2
              }}
            />
            <Typography
              variant='h6'
              sx={{
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              {courseName || 'Course Name Not Available'}
            </Typography>
          </Box>

          <Typography
            variant='h6'
            sx={{
              fontSize: '18px',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            {unitName || 'Unit Name Not Available'}
          </Typography>

          {sectionsLoading || progressLoading ? (
            [...Array(3)].map((_, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Skeleton
                  variant='rectangular'
                  height={80}
                  sx={{ borderRadius: '6px', mb: 1 }}
                />
                <Skeleton width='30%' height={20} sx={{ mb: 1 }} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2
                  }}
                >
                  <Skeleton width='40%' height={20} />
                  <Skeleton width='40%' height={20} />
                </Box>
                <Skeleton variant='rectangular' height={1} sx={{ mb: 3 }} />
              </Box>
            ))
          ) : (
            sections?.map((section, index) => {
              const isUnlocked = isSectionUnlocked(section._id)
              const isAccessible = isSectionAccessible(index)
              const isCompleted = isSectionCompleted(section._id)
              const canOpen = canOpenSection(section._id)

              return (
                <ListItem
                  key={section._id}
                  id={`section-${section._id}`}
                  sx={{
                    pl: '80px',
                    pr: 2,
                    py: 2.5,
                    bgcolor: '#F5F5F5',
                    borderRadius: '6px',
                    boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
                    mb: 1,
                    position: 'relative',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    transition: 'all 0.3s ease',
                    border: location.state?.completedSectionId === section._id ? '2px solid #4caf50' : 'none'
                  }}
                >
                  <Box
                    sx={{
                      mr: 2,
                      color: 'white',
                      minWidth: '70px',
                      bgcolor: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                      textAlign: 'center',
                      borderTopLeftRadius: '6px',
                      borderBottomLeftRadius: '6px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0
                    }}
                  >
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, p: '20px' }}
                    >
                      {section.number}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, width: '100%', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        display: '-webkit-box',
                        textOverflow: 'ellipsis',
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {section.name}
                    </Typography>
                    
                    {isCompleted ? (
                      <CheckCircle 
                        sx={{ ml: 1, color: 'success.main', fontSize: '18px' }} 
                      />
                    ) : canOpen ? (
                      <LockOpenOutlined 
                        sx={{ ml: 1, color: 'primary.main', fontSize: '18px' }} 
                      />
                    ) : (
                      <Tooltip title="Complete previous sections to unlock">
                        <LockOutlined 
                          sx={{ ml: 1, color: 'text.secondary', fontSize: '18px' }} 
                        />
                      </Tooltip>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignSelf: 'flex-end' }}>
                    {section.resources.length > 0 && (
                      <Tooltip title="Learning" placement="top" enterTouchDelay={0} leaveTouchDelay={1500}>
                        <span>
                          <IconButton
                            color={isCompleted ? 'success' : (canOpen ? 'primary' : 'default')}
                            onClick={() => handleSectionClick(section, canOpen)}
                            disabled={!canOpen}
                            sx={{
                              bgcolor: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                              color: 'white',
                              '&:hover': {
                                bgcolor: isCompleted ? 'success.dark' : (canOpen ? 'primary.dark' : '#9e9e9e')
                              },
                              '&.Mui-disabled': {
                                bgcolor: '#9e9e9e',
                                color: 'white'
                              }
                            }}
                          >
                            {canOpen ? <MenuBook /> : <LockOutlined />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {section.assessments?.length > 0 && (
                      <Tooltip title="Assessment" placement="top" enterTouchDelay={0} leaveTouchDelay={1500}>
                        <span>
                          <IconButton
                            color={canOpen ? 'primary' : 'default'}
                            onClick={() => handleAssessmentClick(section, canOpen)}
                            disabled={!canOpen}
                            sx={{
                              bgcolor: canOpen ? 'primary.main' : '#9e9e9e',
                              color: 'white',
                              '&:hover': {
                                bgcolor: canOpen ? 'primary.dark' : '#9e9e9e'
                              },
                              '&.Mui-disabled': {
                                bgcolor: '#9e9e9e',
                                color: 'white'
                              }
                            }}
                          >
                            {canOpen ? <AssignmentOutlined /> : <LockOutlined />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              )
            })
          )}
        </Paper>
        <Dialog
          open={showRestrictionDialog}
          onClose={() => setShowRestrictionDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 300
            }
          }}
        >
          <DialogTitle>Access Restricted</DialogTitle>
          <DialogContent>
            <Typography>
              This content is not available in the demo version. Please contact your administrator for full access.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRestrictionDialog(false)} variant='contained'>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Paper
          elevation={5}
          sx={{
            p: '24px 24px',
            borderRadius: '16px',
            backgroundColor: 'white'
          }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography
              variant='body2'
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                gap: 0
              }}
              onClick={handleBackToUnit}
            >
              <ChevronLeft sx={{ ml: -1 }} /> Back To Unit
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CardMedia
              component='img'
              image={courseImage || '/background-images/1.jpg'}
              alt='Course Image'
              sx={{
                width: 100,
                height: 100,
                borderRadius: '8px',
                mr: 2
              }}
            />
            <Typography
              variant='h6'
              sx={{
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              {courseName || 'Course Name Not Available'}
            </Typography>
          </Box>

          <Typography
            variant='h6'
            sx={{
              fontSize: '18px',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            {unitName || 'Unit Name Not Available'}
          </Typography>

          {sectionsLoading || progressLoading ? (
            [...Array(3)].map((_, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Skeleton
                  variant='rectangular'
                  height={80}
                  sx={{ borderRadius: '6px', mb: 1 }}
                />
                <Skeleton width='30%' height={20} sx={{ mb: 1 }} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2
                  }}
                >
                  <Skeleton width='40%' height={20} />
                  <Skeleton width='40%' height={20} />
                </Box>
                <Skeleton variant='rectangular' height={1} sx={{ mb: 3 }} />
              </Box>
            ))
          ) : (
            sections?.map((section, index) => {
              const isUnlocked = isSectionUnlocked(section._id)
              const isAccessible = isSectionAccessible(index)
              const isCompleted = isSectionCompleted(section._id)
              const canOpen = canOpenSection(section._id)

              return (
                <ListItem
                  key={section._id}
                  id={`section-${section._id}`}
                  sx={{
                    pl: '80px',
                    pr: 2,
                    py: 2.5,
                    bgcolor: '#F5F5F5',
                    borderRadius: '6px',
                    boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
                    mb: 1,
                    position: 'relative',
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    transition: 'all 0.3s ease',
                    border: location.state?.completedSectionId === section._id ? '2px solid #4caf50' : 'none'
                  }}
                >
                  <Box
                    sx={{
                      mr: 2,
                      color: 'white',
                      minWidth: '70px',
                      bgcolor: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                      textAlign: 'center',
                      borderTopLeftRadius: '6px',
                      borderBottomLeftRadius: '6px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0
                    }}
                  >
                    <Typography
                      sx={{ fontSize: '16px', fontWeight: 500, p: '20px' }}
                    >
                      {section.number}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, width: '100%', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Typography
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        display: '-webkit-box',
                        textOverflow: 'ellipsis',
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {section.name}
                    </Typography>
                    {isCompleted ? (
                      <CheckCircle 
                        sx={{ ml: 1, color: 'success.main', fontSize: '18px' }} 
                      />
                    ) : canOpen ? (
                      <LockOpenOutlined 
                        sx={{ ml: 1, color: 'primary.main', fontSize: '18px' }} 
                      />
                    ) : (
                      <Tooltip title="Complete previous sections to unlock">
                        <LockOutlined 
                          sx={{ ml: 1, color: 'text.secondary', fontSize: '18px' }} 
                        />
                      </Tooltip>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1.5,
                      alignSelf: 'flex-end',
                      justifyContent: 'flex-end',
                      maxWidth: '100%'
                    }}
                  >
                    {section.resources.length > 0 && (
                      <Tooltip title={!isAccessible ? "Contact your administrator for full access" : ""} placement="top">
                        <span>
                          <Button
                            variant='contained'
                            startIcon={canOpen ? <MenuBook /> : <LockOutlined />}
                            onClick={() => handleSectionClick(section, canOpen)}
                            disabled={!canOpen}
                            sx={{
                              bgcolor: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                              color: 'white',
                              borderRadius: '8px',
                              textTransform: 'none',
                              '&:hover': {
                                bgcolor: isCompleted ? 'success.dark' : (canOpen ? 'primary.dark' : '#9e9e9e')
                              }
                            }}
                          >
                            Learning
                          </Button>
                        </span>
                      </Tooltip>
                    )}

                    {section.assessments && section.assessments.length > 0 && (
                      <Tooltip title={!isAccessible ? "Contact your administrator for full access" : ""} placement="top">
                        <span>
                          <Button
                            variant='outlined'
                            startIcon={<AssignmentOutlined />}
                            onClick={() => handleAssessmentClick(section, canOpen)}
                            disabled={!canOpen}
                            sx={{
                              color: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                              borderColor: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                              borderRadius: '8px',
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                                backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.04)' : (canOpen ? 'rgba(31, 126, 194, 0.04)' : 'transparent')
                              }
                            }}
                          >
                            Assessment
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
              )
            })
          )}
        </Paper>
      </Grid>
      <Dialog
        open={showRestrictionDialog}
        onClose={() => setShowRestrictionDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 300
          }
        }}
      >
        <DialogTitle>Access Restricted</DialogTitle>
        <DialogContent>
          <Typography>
            This content is not available in the demo version. Please contact your administrator for full access.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRestrictionDialog(false)} variant='contained'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default Section
