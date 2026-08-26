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
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentCourse, setCurrentUnit } from '../../redux/slices/courseSlice'
import { useUnits } from '../../hooks/useUnits'
import { useUnlockStatus } from '../../hooks/useUnlockStatus'
import { useCompletedUnits } from '../../hooks/useCompletedUnits'
import { useSyncCourseUnlock } from '../../hooks/useUnlockSync'
import {
  LayoutChromeNavButtons,
  LayoutChromePaletteButton,
  useClaimLayoutChrome
} from '../layout/LayoutChrome'

import Grid from '@mui/material/Grid2'

const Units = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { currentCourse } = useSelector((state) => state.course)
  useClaimLayoutChrome()

  const { user } = useAuth()
  const { courseId } = useParams()

  const { data: units, isLoading } = useUnits(courseId)
  const { data: unlockStatus, refetch: refetchUnlockStatus } = useUnlockStatus(user?.studentId, courseId)
  const { data: completedUnits = [], refetch: refetchCompletedUnits } = useCompletedUnits(user?.studentId, courseId)
  const syncUnlock = useSyncCourseUnlock()
  const [hasSynced, setHasSynced] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    const runSync = async () => {
      if (!user?.studentId || !courseId || user?.isDemo || hasSynced) return
      try {
        await syncUnlock.mutateAsync({
          studentId: user.studentId,
          courseId
        })
        await Promise.all([refetchUnlockStatus(), refetchCompletedUnits()])
      } catch (error) {
        console.error('Error syncing unit unlock status:', error)
      } finally {
        setHasSynced(true)
      }
    }

    runSync()
  }, [user?.studentId, courseId, user?.isDemo, hasSynced])

  const isUnitUnlocked = (unitId) => {
    if (!unlockStatus?.unlockedUnit) {
      return String(units?.[0]?._id) === String(unitId)
    }

    const unlockedUnitIndex = units?.findIndex(
      (unit) => String(unit._id) === String(unlockStatus.unlockedUnit)
    )

    if (unlockedUnitIndex === -1) {
      return String(units?.[0]?._id) === String(unitId)
    }

    const currentUnitIndex = units?.findIndex((unit) => String(unit._id) === String(unitId))
    const maxUnlockedIndex = unlockedUnitIndex + 1

    return currentUnitIndex !== -1 && currentUnitIndex <= maxUnlockedIndex
  }

  const isUnitCompleted = (unitId) => {
    return completedUnits.some(
      (completedUnitId) => String(completedUnitId) === String(unitId)
    )
  }

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await getData(`courses/${courseId}`)
        if (response.status === 200) {
          dispatch(setCurrentCourse({
            id: courseId,
            name: response.data.course.name,
            image: response.data.course.thumbnail
          }))
        }
      } catch (error) {
        console.error('Error fetching course details:', error)
      }
    }

    if (!currentCourse || currentCourse.id !== courseId) {
      fetchCourseDetails()
    }
  }, [courseId, dispatch])

  const handleUnitClick = (unitId, unitName) => {
    if (!isUnitUnlocked(unitId)) {
      return
    }

    dispatch(setCurrentUnit({
      id: unitId,
      name: unitName,
      isFirstUnit: units[0]._id === unitId
    }))
    navigate(`/units/${courseId}/section/${unitId}`)
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const unitsHeader = (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        background: 'linear-gradient(135deg, #1F7EC2 0%, #155A8F 55%, #0A2540 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <LayoutChromeNavButtons light />
        <Typography
          variant='body2'
          sx={{
            cursor: 'pointer',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            width: 'fit-content',
            gap: 0
          }}
          onClick={handleBackToDashboard}
        >
          <ChevronLeft sx={{ ml: -1, color: '#fff' }} /> Back To Dashboard
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto', flexShrink: 0 }}>
        <LayoutChromePaletteButton light />
      </Box>
    </Box>
  )

  const unitsContent = (
    <Box sx={{ px: isMobile ? '12px' : '24px', py: '24px', bgcolor: 'white' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CardMedia
          component='img'
          image={currentCourse?.image || '/background-images/1.jpg'}
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
          {currentCourse?.name || 'Course Name Not Available'}
        </Typography>
      </Box>

      {isLoading ? (
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
        units?.map((unit) => {
          const isUnlocked = isUnitUnlocked(unit._id)
          const isCompleted = isUnitCompleted(unit._id)
          return (
            <ListItem
              key={unit._id}
              onClick={() => handleUnitClick(unit._id, unit.name)}
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
                  (Sections: {unit.sections.length})
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

  if (isMobile) {
    // Mobile: Only units, no calendar
    return (
      <Box>
        <Paper
          elevation={5}
          sx={{
            borderRadius: '16px',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          {unitsHeader}
          {unitsContent}
        </Paper>
      </Box>
    )
  }

  // Tablet and desktop: keep current layout
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Paper
          elevation={5}
          sx={{
            borderRadius: '16px',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          {unitsHeader}
          {unitsContent}
        </Paper>
      </Grid>
    </Grid>
  )
}

export default Units