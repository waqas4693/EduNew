import {
  Box,
  Card,
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip
} from '@mui/material'
import { getData } from '../../api/api'
import { useState, useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Grid from '@mui/material/Grid2'
import url from '../config/server-url'
import Calendar from '../calendar/Calendar'
import { useDispatch } from 'react-redux'
import { setCurrentCourse } from '../../redux/slices/courseSlice'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SpeedIcon from '@mui/icons-material/Speed'
import { useEnrolledCourses, useCourseProgress, useAssessmentDueDates } from '../../hooks/useCourses'

const getThumbnailUrl = fileName => {
  if (!fileName) return ''
  return `${url}resources/files/THUMBNAILS/${fileName}`
}

// Progress Card Component
const CourseProgressCard = memo(({ courseId, studentId }) => {
  const [openDialog, setOpenDialog] = useState(false)
  const { data: progressData, isLoading } = useCourseProgress(studentId, courseId)

  const overallProgress = progressData?.length > 0
    ? Math.round(progressData.reduce((sum, unit) => sum + unit.progress, 0) / progressData.length)
    : 0

  const handleCardClick = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          height: '100%',
          p: 2,
          border: '1px solid #3366CC33',
          borderRadius: '12px',
          boxShadow: '0px 14px 42px 0px #080F340F',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.02)'
          }
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant='h6' sx={{ mb: 2, fontSize: '16px' }}>
              Course Progress
            </Typography>

            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant='determinate'
                  value={overallProgress}
                  size={80}
                  thickness={4}
                  sx={{ color: 'primary.main' }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography
                    variant='caption'
                    sx={{ fontSize: '16px', fontWeight: 'bold' }}
                  >
                    {`${overallProgress}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography
                sx={{ mt: 2, color: 'text.secondary', fontSize: '14px' }}
              >
                Click to view unit details
              </Typography>
            </Box>
          </Box>
        )}
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 2
          }
        }}
      >
        <DialogTitle>
          <Typography
            variant='h6'
            sx={{ fontSize: '18px', fontWeight: 'bold' }}
          >
            Unit Progress Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {progressData?.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              {progressData.map(unit => (
                <Box key={unit._id} sx={{ mb: 3 }}>
                  <Typography variant='body1' sx={{ mb: 1, fontWeight: 500 }}>
                    {unit.name}
                  </Typography>
                  <Box sx={{ position: 'relative', mb: 0.5 }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: 10,
                        bgcolor: 'grey.100',
                        borderRadius: 1
                      }}
                    >
                      <Box
                        sx={{
                          width: `${unit.progress}%`,
                          height: '100%',
                          bgcolor: 'primary.main',
                          borderRadius: 1,
                          transition: 'width 0.5s ease-in-out'
                        }}
                      />
                    </Box>
                    <Typography
                      variant='body2'
                      sx={{ color: 'text.secondary', mt: 0.5 }}
                    >
                      {unit.progress}% Complete
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color='text.secondary' align='center' sx={{ py: 3 }}>
              No progress data available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant='contained'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
})

// Decorative Card Component
const DecorativeCard = () => {
  return (
    <Card
      sx={{
        height: '100%',
        width: '200px',
        borderRadius: '12px',
        border: '1px solid #3366CC33',
        boxShadow: '0px 14px 42px 0px #080F340F',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2
      }}
    >
      <Box
        component='img'
        src='/ai-education.png'
        alt='AI Education'
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          maxHeight: '160px'
        }}
      />
      <Typography
        sx={{
          mt: 2,
          fontSize: '14px',
          color: 'text.secondary',
          textAlign: 'center'
        }}
      >
        AI-Powered Learning
      </Typography>
    </Card>
  )
}

// Custom hook for handling all assessment due dates
const useAllAssessmentDueDates = (courseEnrollments) => {
  const [allDueDates, setAllDueDates] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAllDueDates = async () => {
      if (!courseEnrollments?.length) return

      try {
        const dueDates = {}
        await Promise.all(
          courseEnrollments.map(async (course) => {
            try {
              const response = await getData(`assessments/due-dates/${course.courseId}?enrollmentDate=${course.enrollmentDate}`)
              if (response.data) {
                Object.assign(dueDates, response.data)
              }
            } catch (err) {
              console.error(`Error fetching due dates for course ${course.courseId}:`, err)
            }
          })
        )
        setAllDueDates(dueDates)
        setError(null)
      } catch (err) {
        console.error('Error fetching all due dates:', err)
        setError(err)
      }
    }

    fetchAllDueDates()
  }, [courseEnrollments])

  return { allDueDates, error }
}

// Course Row Component
const CourseRow = memo(({ course, studentId }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailLoading, setThumbnailLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openAIDialog, setOpenAIDialog] = useState(false)

  const { data: progressData, isLoading: progressLoading } = useCourseProgress(studentId, course.id)
  const { data: dueDates } = useAssessmentDueDates(course.id, course.enrollmentDate)

  const progress = progressData?.length > 0
    ? Math.round(progressData.reduce((sum, unit) => sum + unit.progress, 0) / progressData.length)
    : 0

  // Fetch thumbnail URL
  useEffect(() => {
    const fetchThumbnailUrl = async () => {
      if (course.thumbnail || course.image) {
        try {
          setThumbnailLoading(true)
          const response = await getData(`resources/files/url/THUMBNAILS/${course.thumbnail || course.image}`)
          if (response.status === 200) {
            setThumbnailUrl(response.data.signedUrl)
            setImageError(false)
          }
        } catch (error) {
          console.error('Error fetching thumbnail URL:', error)
          setImageError(true)
        } finally {
          setThumbnailLoading(false)
        }
      } else {
        setImageError(true)
        setThumbnailLoading(false)
      }
    }
    fetchThumbnailUrl()
  }, [course.thumbnail, course.image])

  const handleQuickView = e => {
    e.stopPropagation()
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleThumbnailClick = () => {
    dispatch(
      setCurrentCourse({
        id: course.id,
        name: course.name,
        image: thumbnailUrl || course.thumbnail || course.image
      })
    )
    navigate(`/units/${course.id}`)
  }

  const handleDetailView = (e) => {
    e.stopPropagation()
    navigate(`/students/${studentId}/courses/${course.id}/progress`, {
      state: {
        courseName: course.name,
        studentName: ''
      }
    })
  }

  const handleAIDialogOpen = (e) => {
    e.stopPropagation()
    setOpenAIDialog(true)
  }

  const handleAIDialogClose = () => {
    setOpenAIDialog(false)
  }

  return (
    <Card
      sx={{
        mb: 2,
        width: '100%',
        overflow: 'hidden',
        borderRadius: '12px',
        bgcolor: 'primary.main',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main content container */}
      <Box sx={{ display: 'flex', p: 2, gap: 2 }}>
        {/* Thumbnail Box */}
        <Box
          onClick={handleThumbnailClick}
          sx={{
            flex: 1,
            aspectRatio: '1/1',
            borderRadius: '8px',
            overflow: 'hidden',
            bgcolor: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.9
            }
          }}
        >
          {thumbnailLoading ? (
            <CircularProgress size={32} />
          ) : (course.thumbnail || course.image) && !imageError && thumbnailUrl ? (
            <Box
              component='img'
              src={thumbnailUrl}
              alt={course.name}
              onError={() => setImageError(true)}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                bgcolor: '#e75480',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box
                component='img'
                src='/course-card-placeholder-icon.svg'
                alt='Course placeholder'
                sx={{ width: '48px', height: '48px' }}
              />
            </Box>
          )}
        </Box>

        {/* Progress Box */}
        <Box
          sx={{
            flex: 1,
            aspectRatio: '1/1',
            borderRadius: '8px',
            bgcolor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              onClick={handleQuickView}
              sx={{
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}
            >
              Quick View
            </Button>
            <SpeedIcon 
              sx={{ 
                fontSize: 50,
                color: 'primary.main'
              }} 
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              onClick={handleDetailView}
              sx={{
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}
            >
              Detailed View
            </Button>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={65}
                thickness={8}
                sx={{ color: 'grey.200' }}
              />
              <CircularProgress
                variant="determinate"
                value={progressLoading ? 0 : progress}
                size={65}
                thickness={8}
                sx={{
                  color: 'primary.main',
                  position: 'absolute',
                  left: 0,
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  position: 'absolute',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: 'bold', color: 'primary.main' }}>
                  {progressLoading ? '...' : `${progress}%`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* AI Tutor Box */}
        <Box
          sx={{
            flex: 1,
            aspectRatio: '1/1',
            borderRadius: '8px',
            bgcolor: '#fff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Box
            component='img'
            src='/ai-education.png'
            alt="AI Education"
            onClick={handleAIDialogOpen}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9
              }
            }}
          />
        </Box>
      </Box>

      {/* Labels container */}
      <Box sx={{ display: 'flex', pb: 1 }}>
        <Typography
          sx={{
            flex: 1,
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          {course.name}
        </Typography>
        <Typography
          sx={{
            flex: 1,
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Course Progress
        </Typography>
        <Typography
          sx={{
            flex: 1,
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Test Your Understanding
        </Typography>
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='md'
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 3,
            maxWidth: '900px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography
            variant='h6'
            sx={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}
          >
            {course.name}
          </Typography>
        </DialogTitle>
        <DialogContent
          sx={{
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#3366CC',
              borderRadius: '4px',
              '&:hover': {
                background: '#254e99'
              }
            }
          }}
        >
          <Grid container spacing={3}>
            {progressData?.length > 0 ? (
              progressData.map(unit => (
                <Grid key={unit._id} item size={3}>
                  <Box
                    sx={{
                      p: 3,
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Tooltip title={unit.name} placement='top'>
                      <Typography
                        variant='h6'
                        sx={{
                          fontSize: '16px',
                          fontWeight: 500,
                          textAlign: 'center',
                          width: '100%',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {unit.name}
                      </Typography>
                    </Tooltip>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{
                        textAlign: 'center',
                        mb: 1
                      }}
                    >
                      {unit.viewedResources} out of {unit.totalResources}{' '}
                      resources viewed
                    </Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant='determinate'
                        value={100}
                        size={80}
                        thickness={4}
                        sx={{ color: '#E5E5EF' }}
                      />
                      <CircularProgress
                        variant='determinate'
                        value={unit.progress}
                        size={80}
                        thickness={4}
                        sx={{
                          color: '#3366CC',
                          position: 'absolute',
                          left: 0
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography
                          variant='h6'
                          sx={{ fontSize: '18px', fontWeight: 'bold' }}
                        >
                          {unit.progress}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography
                  color='text.secondary'
                  align='center'
                  sx={{ py: 3 }}
                >
                  No progress data available
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pt: 2 }}>
          <Button
            onClick={handleCloseDialog}
            variant='contained'
            sx={{
              bgcolor: '#3366CC',
              px: 4
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Dialog */}
      <Dialog
        open={openAIDialog}
        onClose={handleAIDialogClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 3,
            maxWidth: '400px',
            width: '100%'
          }
        }}
      >
        <DialogTitle>
          <Typography
            variant="h6"
            sx={{
              fontSize: '20px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: 'primary.main'
            }}
          >
            AI Tutor Feature
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 2
            }}
          >
            <Box
              component="img"
              src="/ai-education.png"
              alt="AI Education"
              sx={{
                width: '120px',
                height: '120px',
                objectFit: 'contain'
              }}
            />
            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                fontSize: '16px'
              }}
            >
              Coming Soon! Our AI tutor feature will help you learn more effectively with personalized assistance.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            onClick={handleAIDialogClose}
            variant="contained"
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
})

const StudentDashboard = () => {
  const { user } = useAuth()
  const courseIds = user?.courseIds?.map(course => course.courseId) || []
  const { data: courses } = useEnrolledCourses(courseIds)
  const { allDueDates, error } = useAllAssessmentDueDates(user?.courseIds)

  if (error) {
    console.error('Error loading assessment due dates:', error)
  }

  return (
    <Grid container spacing={2}>
      <Grid size={8}>
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
            {courses?.length > 0 ? (
              courses.map(course => (
                <Grid key={course.id} xs={12} md={6} lg={4}>
                  <CourseRow course={course} studentId={user.studentId} />
                </Grid>
              ))
            ) : (
              <Grid xs={12}>
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
      <Grid size={4}>
        <Paper
          elevation={5}
          sx={{ backgroundColor: 'transparent', borderRadius: 2 }}
        >
          <Calendar assessmentDueDates={allDueDates} />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default StudentDashboard
