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
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert
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
import EmailIcon from '@mui/icons-material/Email'
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
  const { user } = useAuth()
  const [imageError, setImageError] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailLoading, setThumbnailLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openAIDialog, setOpenAIDialog] = useState(false)
  const [openVerificationDialog, setOpenVerificationDialog] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { data: progressData, isLoading: progressLoading } = useCourseProgress(studentId, course.id)
  const { data: dueDates } = useAssessmentDueDates(course.id, course.enrollmentDate)

  const progress = progressData?.length > 0
    ? Math.round(progressData.reduce((sum, unit) => sum + unit.progress, 0) / progressData.length)
    : 0

  // Check if user is verified
  const isEmailVerified = user?.emailVerified

  // Handle course access restriction
  const handleCourseAccess = (action) => {
    if (!isEmailVerified) {
      setOpenVerificationDialog(true)
      return false
    }
    return true
  }

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
    if (handleCourseAccess('quickView')) {
    setOpenDialog(true)
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleThumbnailClick = () => {
    if (handleCourseAccess('thumbnail')) {
    dispatch(
      setCurrentCourse({
        id: course.id,
        name: course.name,
        image: thumbnailUrl || course.thumbnail || course.image
      })
    )
    navigate(`/units/${course.id}`)
    }
  }

  const handleDetailView = (e) => {
    e.stopPropagation()
    if (handleCourseAccess('detailView')) {
    navigate(`/students/${studentId}/courses/${course.id}/progress`, {
      state: {
        courseName: course.name,
        studentName: ''
      }
    })
    }
  }

  const handleAIDialogOpen = (e) => {
    e.stopPropagation()
    if (handleCourseAccess('aiDialog')) {
    setOpenAIDialog(true)
    }
  }

  const handleAIDialogClose = () => {
    setOpenAIDialog(false)
  }

  const handleVerificationDialogClose = () => {
    setOpenVerificationDialog(false)
  }

  if (isMobile) {
    return (
      <>
      <Card
        sx={{
          mb: 2,
          width: '100%',
          overflow: 'hidden',
          borderRadius: '16px',
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 2,
            opacity: isEmailVerified ? 1 : 0.7,
        }}
      >
        {/* Course Image */}
        <Box
          onClick={handleThumbnailClick}
          sx={{
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: '12px',
            overflow: 'hidden',
            bgcolor: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 1,
            cursor: 'pointer',
            '&:hover': { opacity: 0.9 }
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
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

        {/* Course Name */}
        <Typography
          sx={{
            mt: 1,
            mb: 1,
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'white',
            width: '100%'
          }}
        >
          {course.name}
        </Typography>

        {/* Progress View Buttons */}
        <Box
          sx={{
            width: '100%',
            bgcolor: 'white',
            borderRadius: '12px',
            p: 2,
            mb: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center' }}>
            <Button
              onClick={handleQuickView}
              sx={{
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                color: 'primary.main'
              }}
            >
              Quick View
            </Button>
            <SpeedIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center' }}>
            <Button
              onClick={handleDetailView}
              sx={{
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                color: 'primary.main'
              }}
            >
              Detailed View
            </Button>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={36}
                thickness={5}
                sx={{ color: 'grey.200' }}
              />
              <CircularProgress
                variant="determinate"
                value={progressLoading ? 0 : progress}
                size={36}
                thickness={5}
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
                <Typography variant="caption" sx={{ fontSize: '10px', fontWeight: 'bold', color: 'primary.main' }}>
                  {progressLoading ? '...' : `${progress}%`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Course Progress Label */}
        <Typography
          sx={{
            mt: 1,
            mb: 1,
            fontSize: '15px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'white',
            width: '100%'
          }}
        >
          Course Progress
        </Typography>

        {/* AI Tutor Image */}
        <Box
          onClick={handleAIDialogOpen}
          sx={{
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: '12px',
            overflow: 'hidden',
            bgcolor: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 1,
            cursor: 'pointer',
            '&:hover': { opacity: 0.9 }
          }}
        >
          <Box
            component='img'
            src='/ai-education.png'
            alt="AI Education"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>

        {/* Test Your Understanding Label */}
        <Typography
          sx={{
            mt: 1,
            fontSize: '15px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'white',
            width: '100%'
          }}
        >
          Test Your Understanding
        </Typography>
      </Card>

        {/* Email Verification Dialog */}
        <Dialog
          open={openVerificationDialog}
          onClose={handleVerificationDialogClose}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              p: 2
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center' }}>
            <EmailIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant='h6' sx={{ fontSize: '18px', fontWeight: 'bold' }}>
              Email Verification Required
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please verify your email address to access course content.
            </Alert>
            <Typography variant='body1' sx={{ mb: 2 }}>
              To ensure the security of your account and provide you with the best learning experience, 
              we require email verification before you can access course materials.
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Please check your email inbox for a verification link. If you haven't received the email, 
              please check your spam folder or contact support.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
            <Button 
              onClick={handleVerificationDialogClose} 
              variant='contained'
              sx={{ minWidth: '120px' }}
            >
              Got it
            </Button>
          </DialogActions>
        </Dialog>
      </>
    )
  }

  // Tablet & desktop layout (restored)
  return (
    <>
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
          opacity: isEmailVerified ? 1 : 0.7,
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
    </Card>

      {/* Email Verification Dialog */}
      <Dialog
        open={openVerificationDialog}
        onClose={handleVerificationDialogClose}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant='h6' sx={{ fontSize: '18px', fontWeight: 'bold' }}>
            Email Verification Required
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Please verify your email address to access course content.
          </Alert>
          <Typography variant='body1' sx={{ mb: 2 }}>
            To ensure the security of your account and provide you with the best learning experience, 
            we require email verification before you can access course materials.
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Please check your email inbox for a verification link. If you haven't received the email, 
            please check your spam folder or contact support.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            onClick={handleVerificationDialogClose} 
            variant='contained'
            sx={{ minWidth: '120px' }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
})

const StudentDashboard = () => {
  const { user } = useAuth()
  const courseIds = user?.courseIds?.map(course => course.courseId) || []
  const { data: courses } = useEnrolledCourses(courseIds)
  const { allDueDates, error } = useAllAssessmentDueDates(user?.courseIds)
  
  // Responsive breakpoints
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  if (error) {
    console.error('Error loading assessment due dates:', error)
  }

  return (
    <Box>
      {/* Email Verification Banner */}
      {!user?.emailVerified && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3, 
            borderRadius: '12px',
            '& .MuiAlert-icon': {
              fontSize: '24px'
            }
          }}
          icon={<EmailIcon />}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Email Verification Required
          </Typography>
          <Typography variant="body2">
            Please verify your email address to access course content. Check your inbox for a verification link.
          </Typography>
        </Alert>
      )}

    <Grid container spacing={2}>
      {/* Calendar Section - Top on mobile/tablet, right side on desktop */}
      <Grid 
        size={{ xs: 12, md: 4 }}
        order={{ xs: 1, md: 2 }} // Order 1 on mobile/tablet (top), 2 on desktop (right)
      >
        <Paper
          elevation={5}
          sx={{ backgroundColor: 'transparent', borderRadius: 2 }}
        >
          <Calendar assessmentDueDates={allDueDates} />
        </Paper>
      </Grid>

      {/* Course Cards Section - Bottom on mobile/tablet, left side on desktop */}
      <Grid 
        size={{ xs: 12, md: 8 }}
        order={{ xs: 2, md: 1 }} // Order 2 on mobile/tablet (bottom), 1 on desktop (left)
      >
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
    </Grid>
    </Box>
  )
}

export default StudentDashboard
