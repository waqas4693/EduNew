import {
  Box,
  Card,
  Paper,
  CardMedia,
  Typography,
  CardContent,
  CircularProgress
} from '@mui/material'
import { getData } from '../../api/api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Grid from '@mui/material/Grid2'
import url from '../config/server-url'
import Calendar from '../calendar/Calendar'
import { useDispatch } from 'react-redux'
import { setCurrentCourse } from '../../redux/slices/courseSlice'

const StudentDashboard = () => {
  const [courses, setCourses] = useState([])
  const [loadingImages, setLoadingImages] = useState({})
  const navigate = useNavigate()
  const { user } = useAuth()
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        if (user?.courseIds?.length > 0) {
          const response = await getData(
            `courses/enrolled?courseIds=${user.courseIds.join(',')}`
          )
          if (response.status === 200) {
            setCourses(response.data.data)
            // Initialize loading state for each course image
            const initialLoadingState = {}
            response.data.data.forEach(course => {
              if (course.image) {
                initialLoadingState[course.image] = true
              }
            })
            setLoadingImages(initialLoadingState)
          }
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error)
      }
    }

    fetchEnrolledCourses()
  }, [user])

  const getThumbnailUrl = (fileName) => {
    if (!fileName) return ''
    return `${url}resources/files/THUMBNAILS/${fileName}`
  }

  const handleImageLoad = imageKey => {
    setLoadingImages(prev => ({
      ...prev,
      [imageKey]: false
    }))
  }

  const handleCourseClick = course => {
    dispatch(setCurrentCourse({
      id: course.id,
      name: course.name,
      image: getThumbnailUrl(course.image)
    }))
    navigate(`/units/${course.id}`)
  }

  return (
    <Grid container spacing={2}>
      <Grid size={7.5}>
        <Paper elevation={5} sx={{ p: 3, borderRadius: '16px' }}>
          <Typography
            variant='h6'
            sx={{
              mb: 3,
              fontSize: '24px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          >
            Current Courses
          </Typography>
          <Grid container spacing={2}>
            {courses.length > 0 ? (
              courses.map(course => (
                <Grid item xs={12} key={course.id}>
                  <Card
                    onClick={() => handleCourseClick(course)}
                    sx={{
                      padding: '12px',
                      height: '100%',
                      width: '220px',
                      display: 'flex',
                      border: '1px solid',
                      borderColor: '#3366CC33',
                      borderRadius: '20px',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        cursor: 'pointer'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        height='140'
                        component='img'
                        image={getThumbnailUrl(course.image)}
                        alt={course.name}
                        onLoad={() => handleImageLoad(course.image)}
                        sx={{
                          borderRadius: '12px',
                          objectFit: 'cover',
                          bgcolor: 'grey.200',
                          visibility: loadingImages[course.image]
                            ? 'hidden'
                            : 'visible'
                        }}
                      />
                      {loadingImages[course.image] && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '140px',
                            bgcolor: 'grey.200',
                            borderRadius: '12px'
                          }}
                        >
                          <CircularProgress size={40} />
                        </Box>
                      )}
                    </Box>
                    <CardContent>
                      <Typography sx={{ fontSize: '14px' }}>
                        {course.name}
                      </Typography>
                      <Typography
                        sx={{ mt: 'auto', fontSize: '12px', color: '#5B5B5B' }}
                      >
                        {course.units} Units
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography
                  sx={{ textAlign: 'center', color: 'text.secondary' }}
                >
                  No courses enrolled yet
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
      <Grid size={4.5}>
        <Paper
          elevation={5}
          sx={{ backgroundColor: 'transparent', borderRadius: 2 }}
        >
          <Calendar />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default StudentDashboard
