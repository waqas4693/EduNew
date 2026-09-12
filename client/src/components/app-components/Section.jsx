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
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { setCurrentCourse, setCurrentUnit } from '../../redux/slices/courseSlice'
import { useSectionsUnlockView } from '../../hooks/useCourseUnlockView'
import { getData } from '../../api/api'
import { PageChrome } from '../layout/LayoutChrome'

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const {
    data: unlockView,
    isLoading,
    isError,
    error,
    refetch
  } = useSectionsUnlockView(user?.studentId, courseId, unitId)

  const [courseImage, setCourseImage] = useState('/background-images/1.jpg')
  const [showRestrictionDialog, setShowRestrictionDialog] = useState(false)

  const courseName = unlockView?.course?.name || ''
  const unitName = unlockView?.unit?.name || ''
  const sections = unlockView?.sections || []
  const listLoading = isLoading || !unlockView

  useEffect(() => {
    if (location.state?.refresh) {
      refetch()
      window.history.replaceState({}, document.title)
    }
  }, [location.state?.refresh, refetch])

  useEffect(() => {
    if (location.state?.completedSectionId) {
      const element = document.getElementById(`section-${location.state.completedSectionId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [location.state?.completedSectionId, sections])

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      if (!unlockView?.course || !unlockView?.unit) return

      const thumbnail = unlockView.course.thumbnail
      let imageUrl = '/background-images/1.jpg'

      if (thumbnail) {
        if (String(thumbnail).startsWith('http')) {
          imageUrl = thumbnail
        } else {
          try {
            const thumbnailResponse = await getData(
              `resources/files/url/THUMBNAILS/${thumbnail}`
            )
            if (thumbnailResponse.status === 200) {
              imageUrl = thumbnailResponse.data.signedUrl
            }
          } catch (thumbnailError) {
            console.error('Error fetching course thumbnail:', thumbnailError)
          }
        }
      }

      if (cancelled) return

      setCourseImage(imageUrl)
      dispatch(setCurrentCourse({
        id: courseId,
        name: unlockView.course.name,
        image: imageUrl
      }))
      dispatch(setCurrentUnit({
        id: unitId,
        name: unlockView.unit.name,
        isFirstUnit: unlockView.unit.number === 1
      }))
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [unlockView, courseId, unitId, dispatch])

  const handleBackToUnit = () => {
    navigate(`/units/${courseId}`)
  }

  const isDemoRestricted = (sectionIndex) => {
    if (!user?.isDemo) return false
    return !(unlockView?.unit?.number === 1 && sectionIndex === 0)
  }

  const handleRestrictedClick = () => {
    setShowRestrictionDialog(true)
  }

  const handleSectionClick = (section, sectionIndex) => {
    if (isDemoRestricted(sectionIndex)) {
      handleRestrictedClick()
      return
    }
    if (!section.canOpen) return
    navigate(`/units/${courseId}/section/${unitId}/learn/${section._id}`)
  }

  const handleAssessmentClick = (section, sectionIndex) => {
    if (isDemoRestricted(sectionIndex)) {
      handleRestrictedClick()
      return
    }
    if (!section.canOpen) return
    navigate(`/units/${courseId}/section/${unitId}/assessment/${section._id}`)
  }

  const sectionListSkeleton = (
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
  )

  const sectionCourseIntro = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CardMedia
          component='img'
          image={courseImage}
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
            fontWeight: 'bold',
            minHeight: 28
          }}
        >
          {listLoading ? <Skeleton width={220} /> : courseName}
        </Typography>
      </Box>

      <Typography
        variant='h6'
        sx={{
          fontSize: '18px',
          fontWeight: 'bold',
          mb: 3,
          minHeight: 28
        }}
      >
        {listLoading ? <Skeleton width={180} /> : unitName}
      </Typography>
    </>
  )

  const renderSectionRow = (section, index, mobile) => {
    const canOpen = Boolean(section.canOpen)
    const isCompleted = Boolean(section.completed)
    const demoBlocked = isDemoRestricted(index)

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
          <Typography sx={{ fontSize: '16px', fontWeight: 500, p: '20px' }}>
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
            <CheckCircle sx={{ ml: 1, color: 'success.main', fontSize: '18px' }} />
          ) : canOpen ? (
            <LockOpenOutlined sx={{ ml: 1, color: 'primary.main', fontSize: '18px' }} />
          ) : (
            <Tooltip title="Complete previous sections to unlock">
              <LockOutlined sx={{ ml: 1, color: 'text.secondary', fontSize: '18px' }} />
            </Tooltip>
          )}
        </Box>

        {mobile ? (
          <Box sx={{ display: 'flex', gap: 2, alignSelf: 'flex-end' }}>
            {section.resources?.length > 0 && (
              <Tooltip title="Learning" placement="top" enterTouchDelay={0} leaveTouchDelay={1500}>
                <span>
                  <IconButton
                    color={isCompleted ? 'success' : (canOpen ? 'primary' : 'default')}
                    onClick={() => handleSectionClick(section, index)}
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
                    onClick={() => handleAssessmentClick(section, index)}
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
        ) : (
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
            {section.resources?.length > 0 && (
              <Tooltip title={demoBlocked ? 'Contact your administrator for full access' : ''} placement="top">
                <span>
                  <Button
                    variant='contained'
                    startIcon={canOpen ? <MenuBook /> : <LockOutlined />}
                    onClick={() => handleSectionClick(section, index)}
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

            {section.assessments?.length > 0 && (
              <Tooltip title={demoBlocked ? 'Contact your administrator for full access' : ''} placement="top">
                <span>
                  <Button
                    variant='outlined'
                    startIcon={<AssignmentOutlined />}
                    onClick={() => handleAssessmentClick(section, index)}
                    disabled={!canOpen}
                    sx={{
                      color: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                      borderColor: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                      borderRadius: '8px',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: isCompleted ? 'success.main' : (canOpen ? 'primary.main' : '#9e9e9e'),
                        backgroundColor: isCompleted
                          ? 'rgba(76, 175, 80, 0.04)'
                          : (canOpen ? 'rgba(31, 126, 194, 0.04)' : 'transparent')
                      }
                    }}
                  >
                    Assessment
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        )}
      </ListItem>
    )
  }

  const sectionsList = (
    <>
      {sectionCourseIntro}
      {isError ? (
        <Typography color='error'>
          {error?.response?.data?.message || 'Could not load section unlock status. Please refresh.'}
        </Typography>
      ) : listLoading ? (
        sectionListSkeleton
      ) : (
        sections.map((section, index) => renderSectionRow(section, index, isMobile))
      )}
    </>
  )

  const restrictionDialog = (
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
  )

  const chrome = (
    <PageChrome
      kicker="Learning"
      title={unitName || 'Sections'}
      subtitle={courseName}
      actions={
        <Typography
          variant="body2"
          sx={{
            color: 'secondary.dark',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            whiteSpace: 'nowrap'
          }}
          onClick={handleBackToUnit}
        >
          <ChevronLeft sx={{ ml: -0.5 }} /> Back to unit
        </Typography>
      }
    />
  )

  if (isMobile) {
    return (
      <Box>
        {chrome}
        <Paper
          elevation={5}
          sx={{
            borderRadius: '16px',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ px: '12px', py: '24px', bgcolor: 'white' }}>
            {sectionsList}
          </Box>
        </Paper>
        {restrictionDialog}
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        {chrome}
        <Paper
          elevation={5}
          sx={{
            borderRadius: '16px',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ px: '24px', py: '24px', bgcolor: 'white' }}>
            {sectionsList}
          </Box>
        </Paper>
      </Grid>
      {restrictionDialog}
    </Grid>
  )
}

export default Section
