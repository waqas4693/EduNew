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

const StudentDashboard = () => {
  const [courses, setCourses] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await getData('courses/enrolled')
      if (response.status === 200) {
        setCourses(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleCourseClick = (course) => {
    navigate(`/units/${course.id}`, {
      state: {
        courseName: course.name,
        courseImage: course.image
      }
    })
  }

  return (
    <Grid container spacing={2}>
      <Grid size={7.5}>
        <Paper elevation={5} sx={{ p: 3, borderRadius: '16px' }}>
          <Typography variant='h6' sx={{ mb: 3, fontSize: '24px', textAlign: 'center', fontWeight: 'bold' }}>
            Current Courses
          </Typography>
          <Grid container spacing={2}>
            {courses.map(course => (
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
                    image={course.image}
                    alt={course.name}
                    sx={{ borderRadius: '12px' }}
                  />
                  <CardContent>
                    <Typography sx={{ fontSize: '14px' }}>{course.name}</Typography>
                    <Typography sx={{ mt: 'auto', fontSize: '12px', color: '#5B5B5B' }}>
                      {course.units} Units
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
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
