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

const Units = () => {
  const { user } = useAuth()
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
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'primary.main',
                    cursor: 'pointer',
                  }}
                >
                  &lt; Back To Dashboard
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CardMedia
                  component='img'
                  image='/background-images/1.jpg'
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
                  TQUK Level 3 Certificate in Principles of Customer Service (FO)
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: '#e0e0e0',
                  borderRadius: '16px',
                  p: 2,
                  mb: 3
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: 150,
                    height: 150,
                    mr: 3
                  }}
                >
                  <svg viewBox="0 0 40 40" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <circle
                      cx="18"
                      cy="18"
                      r="18"
                      fill="none"
                      stroke="#f44336"
                      strokeWidth="2"
                      strokeDasharray="50, 100"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="#673ab7"
                      strokeWidth="2"
                      strokeDasharray="50, 100"
                    //   strokeDashoffset="25"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="12"
                      fill="none"
                      stroke="#8bc34a"
                      strokeWidth="2"
                      strokeDasharray="50, 100"
                    //   strokeDashoffset="40"
                    />
                  </svg>
                  
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: '#f44336', borderRadius: '50%', mr: 1 }} />
                    <Typography variant='body2'>Units</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: '#673ab7', borderRadius: '50%', mr: 1 }} />
                    <Typography variant='body2'>Sections</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 10, height: 10, bgcolor: '#8bc34a', borderRadius: '50%', mr: 1 }} />
                    <Typography variant='body2'>Assignments</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    p: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    width: '48%'
                  }}
                >
                  Continue Diagnostic Assessment
                </Box>
                <Box
                  sx={{
                    bgcolor: 'secondary.main',
                    color: 'white',
                    p: 1,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    width: '48%'
                  }}
                >
                  Resume Video
                </Box>
              </Box>

              <Typography variant='body2' sx={{ mb: 2 }}>
                Last Visit: 11/11/2024 at 2 am
              </Typography>

              {[1, 2].map((unit) => (
                <Box
                  key={unit}
                  sx={{
                    bgcolor: '#f0f0f0',
                    p: 2,
                    borderRadius: '8px',
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      Unit:{unit}
                    </Typography>
                    <Typography variant='body2'>
                      Understand the customer service environment
                    </Typography>
                    <Typography variant='body2'>Due Date: 20/11/2024</Typography>
                  </Box>
                  <Typography variant='body2' sx={{ color: 'primary.main' }}>
                    &gt;
                  </Typography>
                </Box>
              ))}
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

export default Units
