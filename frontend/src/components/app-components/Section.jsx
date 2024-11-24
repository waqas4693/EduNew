import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  CardMedia,
  ListItem
} from '@mui/material'
import AssignmentIcon from '@mui/icons-material/Assignment'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Calendar from '../calendar/Calendar'
import Grid from '@mui/material/Grid2'
import { getData } from '../../api/api'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'
import MenuBook from '@mui/icons-material/MenuBook'

const Section = () => {
  const navigate = useNavigate()
  const [sections, setSections] = useState([])
  const location = useLocation()
  const { unitName, courseName, courseImage } = location.state || {}

  const { courseId, unitId } = useParams()

  const handleBackToUnit = () => {
    navigate(`/units/${courseId}`)
  }

  useEffect(() => {
    fetchUnitSections()
  }, [unitId])

  const fetchUnitSections = async () => {
    try {
      const response = await getData(`sections/${unitId}`)
      if (response.status === 200) {
        setSections(response.data.sections)
      }
    } catch (error) {
      console.error('Error fetching unit details:', error)
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid size={7.5}>
        <Paper
          elevation={5}
          sx={{ p: 3, borderRadius: '16px', backgroundColor: 'white' }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography
              variant='body2'
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              onClick={handleBackToUnit}
            >
              <ChevronLeft /> Back To Unit
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

          <Typography
            variant='h6'
            sx={{
              fontSize: '18px',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            Unit: {unitName || 'Unit Name Not Available'}
          </Typography>

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
                />
                <circle
                  cx='18'
                  cy='18'
                  r='12'
                  fill='none'
                  stroke='#8bc34a'
                  strokeWidth='2'
                  strokeDasharray='50, 100'
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
                <Typography variant='body2'>Total Sections: 4</Typography>
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
                <Typography variant='body2'>Completed Sections: 2</Typography>
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
                <Typography variant='body2'>Total Assignments: 10</Typography>
              </Box>
            </Box>
          </Box>

          {sections.map((section, index) => (
            <>
              <ListItem
                key={section._id}
                sx={{
                  pl: '80px',
                  pr: 2,
                  py: 2.5,
                  bgcolor: '#F5F5F5',
                  borderRadius: '6px',
                  boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
                  mb: 1,
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {/* Section Number Box */}
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
                    Sec:{index + 1}
                  </Typography>
                </Box>

                {/* Section Title */}
                <Box sx={{ flex: 1 }}>
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
                    {section.name ||
                      'Understand the customer service environment'}
                  </Typography>
                </Box>
              </ListItem>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: 'text.secondary'
                  }}
                >
                  <Box component='span' sx={{ color: 'black' }}>
                    Due Date:
                  </Box>{' '}
                  {section.dueDate || '20/11/2024'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant='outlined'
                    startIcon={<AssignmentOutlined />}
                    onClick={() =>
                      navigate(
                        `/units/${courseId}/section/${unitId}/assessment/${section._id}`
                      )
                    }
                    sx={{
                      color: '#4169e1',
                      borderColor: '#4169e1',
                      borderRadius: '8px',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#4169e1',
                        backgroundColor: 'rgba(65, 105, 225, 0.04)'
                      }
                    }}
                  >
                    Assessment
                  </Button>
                  <Button
                    variant='contained'
                    startIcon={<MenuBook />}
                    onClick={() =>
                      navigate(
                        `/units/${courseId}/section/${unitId}/learn/${section._id}`
                      )
                    }
                    sx={{
                      bgcolor: '#4169e1',
                      color: 'white',
                      borderRadius: '8px',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#3557c5'
                      }
                    }}
                  >
                    Learning
                  </Button>
                </Box>
              </Box>

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

export default Section
