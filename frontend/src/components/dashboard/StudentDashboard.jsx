import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Paper
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { getData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Calendar from '../calendar/Calendar'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import url from '../config/server-url'

const StudentDashboard = () => {
  const [courses, setCourses] = useState([])
  const [thumbnailUrls, setThumbnailUrls] = useState({})
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        if (user?.courseIds?.length > 0) {
          const response = await getData(`courses/enrolled?courseIds=${user.courseIds.join(',')}`)
          if (response.status === 200) {
            setCourses(response.data.data)
            // Fetch thumbnail URLs for each course
            response.data.data.forEach(course => {
              if (course.image) {
                fetchThumbnailUrl(course.image)
              }
            })
          }
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error)
      }
    }

    fetchEnrolledCourses()
  }, [user])

  const fetchThumbnailUrl = async (fileName) => {
    try {
      const response = await axios.post(`${url}s3/get`, {
        fileName
      })
      setThumbnailUrls(prev => ({
        ...prev,
        [fileName]: response.data.signedUrl
      }))
    } catch (error) {
      console.error('Error fetching thumbnail URL:', error)
    }
  }

  const handleCourseClick = course => {
    navigate(`/units/${course.id}`, {
      state: {
        courseName: course.name,
        courseImage: thumbnailUrls[course.image] || course.image
      }
    })
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
            My Enrolled Courses
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
                    <CardMedia
                      height='140'
                      component='img'
                      image={thumbnailUrls[course.image] || ''}  // Use S3 URL if available
                      alt={course.name}
                      sx={{ 
                        borderRadius: '12px',
                        objectFit: 'cover',
                        bgcolor: 'grey.200' // Placeholder background while loading
                      }}
                    />
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
                <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  No courses enrolled yet
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
      <Grid size={4.5}>
        <Paper elevation={5} sx={{ backgroundColor: 'transparent', borderRadius: 2 }}>
          <Calendar />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default StudentDashboard
