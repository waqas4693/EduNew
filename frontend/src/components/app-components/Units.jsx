import {
  Box,
  CardMedia,
  Typography,
  Paper,
  ListItem,
  Skeleton
} from '@mui/material'
import {
  ChevronLeft,
  PlayArrow,
  AssignmentOutlined,
  ChevronRight
} from '@mui/icons-material'
import { getData } from '../../api/api'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentCourse, setCurrentUnit } from '../../redux/slices/courseSlice'

import Grid from '@mui/material/Grid2'
import Calendar from '../calendar/Calendar'

const Units = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { currentCourse } = useSelector((state) => state.course)

  const { user } = useAuth()
  const { courseId } = useParams()

  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log(currentCourse)
  }, [currentCourse])

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

  useEffect(() => {
    fetchUnits()
  }, [courseId])

  const fetchUnits = async () => {
    try {
      const response = await getData(`units/${courseId}`)
      if (response.status === 200) {
        setUnits(response.data.units)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnitClick = (unitId, unitName) => {
    dispatch(setCurrentUnit({
      id: unitId,
      name: unitName
    }))
    navigate(`/units/${courseId}/section/${unitId}`)
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
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
          </Box>

          {/* <Typography variant='body2' sx={{ mb: 2 }}>
            Last Visit: 11/11/2024 at 2 am
          </Typography> */}

          {loading ? (
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
            units.map((unit, index) => (
              <>
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
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box
                    sx={{
                      mr: 2,
                      color: 'white',
                      minWidth: '70px',
                      bgcolor: '#4169e1',
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
                      {index + 1}
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
                  <ChevronRight sx={{ color: 'primary.main' }} />
                </ListItem>
                <Typography
                  sx={{
                    mb: 1,
                    fontSize: '14px',
                    color: 'text.secondary'
                  }}
                >
                  <Box component='span' sx={{ color: 'black' }}>
                    Due Date:
                  </Box>{' '}
                  {unit.dueDate || '20/11/2024'}
                </Typography>
                <Box
                  sx={{
                    border: '1px solid #0000001A',
                    width: '100%',
                    mb: 3
                  }}
                />
              </>
            ))
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