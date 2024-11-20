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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState({
    enrolledCourses: [
      {
        id: 1,
        name: 'TQUK Level 3 Certificate in Principles of Customer Service (FO)',
        units: 4,
        image: '/background-images/1.jpg'
      },
      {
        id: 2,
        name: 'Physics',
        units: 3,
        image: '/background-images/2.jpg'
      }
    ],
    recentActivities: [],
    progress: {}
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    // API call implementation
  }

  const handleCardClick = (courseId) => {
    navigate(`/units/${courseId}`)
  }

  return (
      <Grid container spacing={2}>
        {/* Courses Section */}
        <Grid size={7.5}>
            <Paper
              elevation={5}
              sx={{
                p: 3,
                borderRadius: '16px',
                backgroundColor: 'white'
              }}
            >
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
                {dashboardData.enrolledCourses.map(course => (
                  <Grid item xs={12} key={course.id}>
                    <Card
                      sx={{
                        padding: '12px',
                        height: '100%',
                        width: '220px',
                        display: 'flex',
                        borderRadius: '20px',
                        flexDirection: 'column',
                        transition: 'transform 0.2s',
                        border: '1px solid #3366CC33',
                        boxShadow: '0px 14px 42px 0px #080F340F',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => handleCardClick(course.id)}
                    >
                      <CardMedia
                        height='140'
                        component='img'
                        image={course.image}
                        alt={course.name}
                        sx={{
                          objectFit: 'cover',
                          borderRadius: '12px'
                        }}
                      />
                      <CardContent 
                        sx={{ 
                          gap: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          paddingTop: 2,
                          paddingLeft: 0,
                          paddingRight: 0,
                          paddingBottom: 0
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '14px'
                          }}
                        >
                          {course.name}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 'auto',
                            fontSize: '12px',
                            color: '#5B5B5B'
                          }}
                        >
                          {course.units} Units
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
        
        </Grid>

        {/* Calendar Section */}
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

export default StudentDashboard
