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
  PlayArrow,
  AssignmentOutlined,
  ChevronRight,
  LockOutlined
} from '@mui/icons-material'
import { getData } from '../../api/api'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentCourse, setCurrentUnit } from '../../redux/slices/courseSlice'
import { useUnits } from '../../hooks/useUnits'
import { useUnlockStatus } from '../../hooks/useUnlockStatus'

import Grid from '@mui/material/Grid2'
import Calendar from '../calendar/Calendar'

const Units = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { currentCourse } = useSelector((state) => state.course)

  const { user } = useAuth()
  const { courseId } = useParams()

  const { data: units, isLoading } = useUnits(courseId)
  const { data: unlockStatus } = useUnlockStatus(user?.studentId, courseId)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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
    if (!unlockStatus?.unlockedUnits?.includes(unitId)) {
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

  if (isMobile) {
    // Mobile: Calendar on top, then units
    return (
      <Box>
        <Paper
          elevation={5}
          sx={{
            backgroundColor: 'transparent',
            borderRadius: 2,
            mb: 2
          }}
        >
          <Calendar />
        </Paper>
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
                cursor: 'pointer',
                color: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                gap: 0
              }}
              onClick={handleBackToDashboard}
            >
              <ChevronLeft sx={{ ml: -1 }} /> Back To Dashboard
            </Typography>
          </Box>

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

          {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                color: 'primary.main',
                p: 1,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                width: '48%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <AssignmentOutlined sx={{ fontSize: 20 }} />
              Continue Diagnostic Assessment
            </Box>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: 1,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                width: '48%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlayArrow sx={{ fontSize: 16 }} />
              </Box>
              Resume Learning
            </Box>
          </Box> */}

          {/* <Typography variant='body2' sx={{ mb: 2 }}>
            Last Visit: 11/11/2024 at 2 am
          </Typography> */}

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
              const isUnlocked = unlockStatus?.unlockedUnits?.includes(unit._id)
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
                      bgcolor: isUnlocked ? '#4169e1' : '#9e9e9e',
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
                    <ChevronRight sx={{ color: 'primary.main' }} />
                  ) : (
                    <LockOutlined sx={{ color: 'text.secondary' }} />
                  )}
                </ListItem>
              )
            })
          )}
        </Paper>
      </Box>
    )
  }

  // Tablet and desktop: keep current layout
  return (
    <Grid container spacing={2}>
      <Grid size={7.5}>
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
                cursor: 'pointer',
                color: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                gap: 0
              }}
              onClick={handleBackToDashboard}
            >
              <ChevronLeft sx={{ ml: -1 }} /> Back To Dashboard
            </Typography>
          </Box>

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

          {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'primary.main',
                color: 'primary.main',
                p: 1,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                width: '48%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <AssignmentOutlined sx={{ fontSize: 20 }} />
              Continue Diagnostic Assessment
            </Box>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: 1,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                width: '48%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PlayArrow sx={{ fontSize: 16 }} />
              </Box>
              Resume Learning
            </Box>
          </Box> */}

          {/* <Typography variant='body2' sx={{ mb: 2 }}>
            Last Visit: 11/11/2024 at 2 am
          </Typography> */}

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
              const isUnlocked = unlockStatus?.unlockedUnits?.includes(unit._id)
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
                      bgcolor: isUnlocked ? '#4169e1' : '#9e9e9e',
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
                    <ChevronRight sx={{ color: 'primary.main' }} />
                  ) : (
                    <LockOutlined sx={{ color: 'text.secondary' }} />
                  )}
                </ListItem>
              )
            })
          )}
        </Paper>
      </Grid>
      <Grid size={4.5}>
        <Paper
          elevation={5}
          sx={{
            backgroundColor: 'transparent',
            borderRadius: 2,
            height: 'fit-content'
          }}
        >
          <Calendar />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default Units