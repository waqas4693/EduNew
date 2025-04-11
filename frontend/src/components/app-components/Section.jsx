import {
  Box,
  Typography,
  Paper,
  Button,
  CardMedia,
  ListItem,
  Skeleton,
  LinearProgress,
  Tooltip,
  Badge,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { getData } from '../../api/api'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentUnit } from '../../redux/slices/courseSlice'
import { useAuth } from '../../context/AuthContext'

import Grid from '@mui/material/Grid2'
import Calendar from '../calendar/Calendar'
import MenuBook from '@mui/icons-material/MenuBook'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined'
import LockOutlined from '@mui/icons-material/LockOutlined'
import LockOpenOutlined from '@mui/icons-material/LockOpenOutlined'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'

const Section = () => {
  const navigate = useNavigate()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [unlockedSections, setUnlockedSections] = useState([])
  const [completedSections, setCompletedSections] = useState([])
  const [loadingUnlockStatus, setLoadingUnlockStatus] = useState(true)
  const [showRestrictionDialog, setShowRestrictionDialog] = useState(false)
  const { user } = useAuth()

  const { courseId, unitId } = useParams()
  const dispatch = useDispatch()
  const { currentCourse, currentUnit } = useSelector(state => state.course)

  useEffect(() => {
    const fetchUnitDetails = async () => {
      try {
        const response = await getData(`units/${unitId}`)
        if (response.status === 200) {
          dispatch(
            setCurrentUnit({
              id: unitId,
              name: response.data.unit.name
            })
          )
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

  useEffect(() => {
    if (user?.studentId && sections.length > 0) {
      fetchUnlockedSections()
      fetchCompletedSections()
    }
  }, [unitId, user?.studentId, sections.length])

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

  const fetchUnlockedSections = async () => {
    setLoadingUnlockStatus(true)
    try {
      const response = await getData(`section-unlock/${user.studentId}/${courseId}/${unitId}`)
      if (response.status === 200) {
        setUnlockedSections(response.data.unlockedSections)
      }
    } catch (error) {
      console.error('Error fetching unlocked sections:', error)
    } finally {
      setLoadingUnlockStatus(false)
    }
  }

  const fetchCompletedSections = async () => {
    try {
      // Fetch completed sections for each section
      const completedSectionsArray = []
      
      for (const section of sections) {
        const response = await getData(`section-unlock/check-completion/${user.studentId}/${courseId}/${unitId}/${section._id}`)
        if (response.status === 200 && response.data.isCompleted) {
          completedSectionsArray.push(section._id)
        }
      }
      
      setCompletedSections(completedSectionsArray)
    } catch (error) {
      console.error('Error fetching completed sections:', error)
    }
  }

  const isSectionUnlocked = (sectionId) => {
    return unlockedSections.includes(sectionId)
  }

  const isSectionCompleted = (sectionId) => {
    return completedSections.includes(sectionId)
  }

  const isSectionAccessible = (sectionIndex) => {
    if (!user?.isDemo) return true
    return currentUnit?.isFirstUnit && sectionIndex === 0
  }

  const handleRestrictedClick = () => {
    setShowRestrictionDialog(true)
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
            {unitName || 'Unit Name Not Available'}
          </Typography>

          {loading || loadingUnlockStatus
            ? [...Array(3)].map((_, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Skeleton
                    variant='rectangular'
                    height={80}
                    sx={{ borderRadius: '6px', mb: 1 }}
                  />
                  <Skeleton width='30%' height={20} sx={{ mb: 1 }} />
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2
                    }}
                  >
                    <Skeleton width='40%' height={20} />
                    <Skeleton width='40%' height={20} />
                  </Box>
                  <Skeleton variant='rectangular' height={1} sx={{ mb: 3 }} />
                </Box>
              ))
            : sections.map((section, index) => {
                const isUnlocked = isSectionUnlocked(section._id)
                const isCompleted = isSectionCompleted(section._id)
                const isAccessible = isSectionAccessible(index)

                return (
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
                      cursor: 'default',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Box
                      sx={{
                        mr: 2,
                        color: 'white',
                        minWidth: '70px',
                        bgcolor: isCompleted ? 'success.main' : isUnlocked ? '#4169e1' : '#9e9e9e',
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
                      <Typography
                        sx={{ fontSize: '16px', fontWeight: 500, p: '20px' }}
                      >
                        {section.number}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, width: '100%', mb: 2, display: 'flex', alignItems: 'center' }}>
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
                      
                      {isCompleted ? (
                        <CheckCircleOutline 
                          sx={{ 
                            ml: 1, 
                            color: 'success.main',
                            fontSize: '18px'
                          }} 
                        />
                      ) : isUnlocked ? (
                        <LockOpenOutlined 
                          sx={{ 
                            ml: 1, 
                            color: 'primary.main',
                            fontSize: '18px'
                          }} 
                        />
                      ) : (
                        <Tooltip title="Complete previous sections to unlock">
                          <LockOutlined 
                            sx={{ 
                              ml: 1, 
                              color: 'text.secondary',
                              fontSize: '18px'
                            }} 
                          />
                        </Tooltip>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignSelf: 'flex-end' }}>
                      {section.resources.length > 0 && (
                        <Tooltip 
                          title={!isAccessible ? "Contact admin@example.com for full access" : ""}
                          placement="top"
                        >
                          <span>
                            <Button
                              variant='contained'
                              startIcon={isUnlocked ? <MenuBook /> : <LockOutlined />}
                              onClick={() => {
                                if (!isAccessible) {
                                  handleRestrictedClick()
                                  return
                                }
                                if (isUnlocked) {
                                  navigate(
                                    `/units/${courseId}/section/${unitId}/learn/${section._id}`
                                  )
                                }
                              }}
                              disabled={!isUnlocked || !isAccessible}
                              sx={{
                                bgcolor: isCompleted ? 'success.main' : isUnlocked ? '#4169e1' : '#9e9e9e',
                                color: 'white',
                                borderRadius: '8px',
                                textTransform: 'none',
                                '&:hover': {
                                  bgcolor: isCompleted ? 'success.dark' : isUnlocked ? '#3557c5' : '#9e9e9e'
                                }
                              }}
                            >
                              {isCompleted ? 'Completed' : 'Learning'}
                            </Button>
                          </span>
                        </Tooltip>
                      )}

                      <Tooltip 
                        title={!isAccessible ? "Contact admin@example.com for full access" : ""}
                        placement="top"
                      >
                        <span>
                          <Button
                            variant='outlined'
                            startIcon={<SmartToyOutlined />}
                            disabled={!isUnlocked || !isAccessible}
                            onClick={() => {
                              if (!isAccessible) {
                                handleRestrictedClick()
                              }
                            }}
                            sx={{
                              color: isUnlocked ? '#4169e1' : '#9e9e9e',
                              borderColor: isUnlocked ? '#4169e1' : '#9e9e9e',
                              borderRadius: '8px',
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: isUnlocked ? '#4169e1' : '#9e9e9e',
                                backgroundColor: isUnlocked ? 'rgba(65, 105, 225, 0.04)' : 'transparent'
                              }
                            }}
                          >
                            AI Practice
                          </Button>
                        </span>
                      </Tooltip>

                      {section.assessments && section.assessments.length > 0 && (
                        <Tooltip 
                          title={!isAccessible ? "Contact admin@example.com for full access" : ""}
                          placement="top"
                        >
                          <span>
                            <Button
                              variant='outlined'
                              startIcon={<AssignmentOutlined />}
                              onClick={() => {
                                if (!isAccessible) {
                                  handleRestrictedClick()
                                  return
                                }
                                if (isUnlocked) {
                                  navigate(
                                    `/units/${courseId}/section/${unitId}/assessment/${section._id}`
                                  )
                                }
                              }}
                              disabled={!isUnlocked || !isAccessible}
                              sx={{
                                color: isUnlocked ? '#4169e1' : '#9e9e9e',
                                borderColor: isUnlocked ? '#4169e1' : '#9e9e9e',
                                borderRadius: '8px',
                                textTransform: 'none',
                                '&:hover': {
                                  borderColor: isUnlocked ? '#4169e1' : '#9e9e9e',
                                  backgroundColor: isUnlocked ? 'rgba(65, 105, 225, 0.04)' : 'transparent'
                                }
                              }}
                            >
                              Assessment
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItem>
                )
              })}
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

      <Dialog
        open={showRestrictionDialog}
        onClose={() => setShowRestrictionDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 300
          }
        }}
      >
        <DialogTitle>Access Restricted</DialogTitle>
        <DialogContent>
          <Typography>
            This content is not available in the demo version. Please contact admin@example.com for full access.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRestrictionDialog(false)} variant='contained'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default Section
