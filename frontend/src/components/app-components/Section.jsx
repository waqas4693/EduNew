import {
  Box,
  Typography,
  Paper,
  Button,
  CardMedia,
  ListItem,
  Skeleton
} from '@mui/material'
import { getData } from '../../api/api'
import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentUnit } from '../../redux/slices/courseSlice'

import Grid from '@mui/material/Grid2'
import Calendar from '../calendar/Calendar'
import MenuBook from '@mui/icons-material/MenuBook'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'

const Section = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  const { courseId, unitId } = useParams()
  const dispatch = useDispatch()
  const { currentCourse, currentUnit } = useSelector((state) => state.course)

  useEffect(() => {
    const fetchUnitDetails = async () => {
      try {
        const response = await getData(`units/${unitId}`)
        if (response.status === 200) {
          dispatch(setCurrentUnit({
            id: unitId,
            name: response.data.unit.name
          }))
        }
      } catch (error) {
        console.error('Error fetching unit details:', error)
      }
    }

    if (!currentUnit || currentUnit.id !== unitId) {
      fetchUnitDetails()
    }
  }, [unitId, dispatch])

  const courseName = currentCourse?.name
  const courseImage = currentCourse?.image
  const unitName = currentUnit?.name

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
    } finally {
      setLoading(false)
    }
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
                color: 'primary.main',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                gap: 0
              }}
              onClick={handleBackToUnit}
            >
              <ChevronLeft sx={{ ml: -1 }} /> Back To Unit
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
            sections.map((section, index) => (
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

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {section.resources.length > 0 && (
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
                  )}
                  {section.assessments && section.assessments.length > 0 && (
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
                  )}
                </Box>
              </ListItem>
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

export default Section