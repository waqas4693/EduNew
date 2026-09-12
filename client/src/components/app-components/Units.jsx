import {
  Box,
  CardMedia,
  Typography,
  Paper,
  ListItem,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  LockOutlined,
  CheckCircle
} from '@mui/icons-material'
import { getData } from '../../api/api'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCurrentCourse, setCurrentUnit } from '../../redux/slices/courseSlice'
import { useUnitsUnlockView } from '../../hooks/useCourseUnlockView'
import { PageChrome } from '../layout/LayoutChrome'

import Grid from '@mui/material/Grid2'

const Units = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { courseId } = useParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const {
    data: unlockView,
    isLoading,
    isError,
    error
  } = useUnitsUnlockView(user?.studentId, courseId)

  const [courseImage, setCourseImage] = useState('/background-images/1.jpg')

  const courseName = unlockView?.course?.name || ''
  const units = unlockView?.units || []

  useEffect(() => {
    let cancelled = false

    const loadThumbnail = async () => {
      const thumbnail = unlockView?.course?.thumbnail
      if (!thumbnail) {
        setCourseImage('/background-images/1.jpg')
        return
      }

      if (String(thumbnail).startsWith('http')) {
        setCourseImage(thumbnail)
        return
      }

      try {
        const thumbnailResponse = await getData(`resources/files/url/THUMBNAILS/${thumbnail}`)
        if (!cancelled && thumbnailResponse.status === 200) {
          setCourseImage(thumbnailResponse.data.signedUrl)
        }
      } catch (thumbnailError) {
        console.error('Error fetching course thumbnail:', thumbnailError)
        if (!cancelled) setCourseImage('/background-images/1.jpg')
      }
    }

    if (unlockView?.course) {
      dispatch(setCurrentCourse({
        id: courseId,
        name: unlockView.course.name,
        image: courseImage
      }))
      loadThumbnail()
    }

    return () => {
      cancelled = true
    }
  }, [unlockView?.course, courseId, dispatch])

  useEffect(() => {
    if (!unlockView?.course?.name) return
    dispatch(setCurrentCourse({
      id: courseId,
      name: unlockView.course.name,
      image: courseImage
    }))
  }, [courseImage, unlockView?.course?.name, courseId, dispatch])

  const handleUnitClick = (unit) => {
    if (!unit.canOpen) return

    dispatch(setCurrentUnit({
      id: unit._id,
      name: unit.name,
      isFirstUnit: String(units[0]?._id) === String(unit._id)
    }))
    navigate(`/units/${courseId}/section/${unit._id}`)
  }

  const listLoading = isLoading || !unlockView

  const unitsContent = (
    <Box sx={{ px: isMobile ? '12px' : '24px', py: '24px', bgcolor: 'white' }}>
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
            fontWeight: 'bold'
          }}
        >
          {listLoading ? <Skeleton width={220} /> : courseName}
        </Typography>
      </Box>

      {isError ? (
        <Typography color='error'>
          {error?.response?.data?.message || 'Could not load unit unlock status. Please refresh.'}
        </Typography>
      ) : listLoading ? (
        [...Array(3)].map((_, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: '6px', mb: 1 }} />
            <Skeleton width="30%" height={20} sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Skeleton width="40%" height={20} />
              <Skeleton width="40%" height={20} />
            </Box>
            <Skeleton variant="rectangular" height={1} sx={{ mb: 3 }} />
          </Box>
        ))
      ) : (
        units.map((unit) => {
          const isUnlocked = Boolean(unit.canOpen)
          const isCompleted = Boolean(unit.completed)
          return (
            <ListItem
              key={unit._id}
              onClick={() => handleUnitClick(unit)}
              sx={{
                pl: '80px',
                pr: 2,
                bgcolor: '#F5F5F5',
                borderRadius: '6px',
                boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
                mb: 1,
                position: 'relative',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: isUnlocked ? 1 : 0.7
              }}
            >
              <Box
                sx={{
                  mr: 2,
                  color: 'white',
                  minWidth: '70px',
                  bgcolor: isCompleted ? 'success.main' : (isUnlocked ? 'primary.main' : '#9e9e9e'),
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
                  {unit.number}
                </Typography>
              </Box>
              <Box>
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
                  {unit.name}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'text.secondary',
                    mt: 1
                  }}
                >
                  (Sections: {unit.sections?.length || 0})
                </Typography>
              </Box>
              {isUnlocked ? (
                isCompleted ? (
                  <CheckCircle sx={{ color: 'success.main' }} />
                ) : (
                  <ChevronRight sx={{ color: 'primary.main' }} />
                )
              ) : (
                <LockOutlined sx={{ color: 'text.secondary' }} />
              )}
            </ListItem>
          )
        })
      )}
    </Box>
  )

  const pageTitle = courseName || 'Course units'

  if (isMobile) {
    return (
      <Box>
        <PageChrome
          kicker="Learning"
          title={pageTitle}
          actions={
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                color: 'secondary.dark',
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft sx={{ ml: -0.5 }} /> Back to dashboard
            </Typography>
          }
        />
        <Paper
          elevation={5}
          sx={{
            borderRadius: '16px',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          {unitsContent}
        </Paper>
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <PageChrome
          kicker="Learning"
          title={pageTitle}
          actions={
            <Typography
              variant="body2"
              sx={{
                cursor: 'pointer',
                color: 'secondary.dark',
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft sx={{ ml: -0.5 }} /> Back to dashboard
            </Typography>
          }
        />
        <Paper
          elevation={5}
          sx={{
            borderRadius: '16px',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          {unitsContent}
        </Paper>
      </Grid>
    </Grid>
  )
}

export default Units
