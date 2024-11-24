import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Paper,
  List,
  ListItem
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { getData } from '../../api/api'
import { useAuth } from '../../context/AuthContext'
import Calendar from '../calendar/Calendar'
import {
  ChevronLeft,
  PlayArrow,
  AssignmentOutlined,
  ChevronRight
} from '@mui/icons-material'

const Units = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { courseId } = useParams()
  const location = useLocation()
  const { courseName, courseImage } = location.state || {}
  const [units, setUnits] = useState([])

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
    }
  }

  const handleUnitClick = (unitId, unitName) => {
    navigate(`/units/${courseId}/section/${unitId}`, {
      state: {
        unitName: unitName,
        courseName: courseName,
        courseImage: courseImage
      }
    })
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
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
                fontSize: '14px',
                cursor: 'pointer',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={handleBackToDashboard}
            >
              <ChevronLeft sx={{ m: 0 }} /> Back To Dashboard
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CardMedia
              component='img'
              image={courseImage || '/background-images/1.jpg'}
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
              {courseName || 'Course Name Not Available'}
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
              <svg
                viewBox='0 0 40 40'
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <circle
                  cx='18'
                  cy='18'
                  r='18'
                  fill='none'
                  stroke='#f44336'
                  strokeWidth='2'
                  strokeDasharray='50, 100'
                />
                <circle
                  cx='18'
                  cy='18'
                  r='15'
                  fill='none'
                  stroke='#673ab7'
                  strokeWidth='2'
                  strokeDasharray='50, 100'
                  //   strokeDashoffset="25"
                />
                <circle
                  cx='18'
                  cy='18'
                  r='12'
                  fill='none'
                  stroke='#8bc34a'
                  strokeWidth='2'
                  strokeDasharray='50, 100'
                  //   strokeDashoffset="40"
                />
              </svg>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    bgcolor: '#f44336',
                    borderRadius: '50%',
                    mr: 1
                  }}
                />
                <Typography variant='body2'>Units</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    bgcolor: '#673ab7',
                    borderRadius: '50%',
                    mr: 1
                  }}
                />
                <Typography variant='body2'>Sections</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    bgcolor: '#8bc34a',
                    borderRadius: '50%',
                    mr: 1
                  }}
                />
                <Typography variant='body2'>Assignments</Typography>
              </Box>
            </Box>
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
              Resume Video
            </Box>
          </Box>

          <Typography variant='body2' sx={{ mb: 2 }}>
            Last Visit: 11/11/2024 at 2 am
          </Typography>

          {units.map((unit, index) => (
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
                  <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
                    Unit: {index + 1}
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
