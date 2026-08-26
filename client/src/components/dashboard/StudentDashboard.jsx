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
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material'
import { getData } from '../../api/api'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, memo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { setCurrentCourse } from '../../redux/slices/courseSlice'
import { useEnrolledCourses, useCourseProgress } from '../../hooks/useCourses'

import Grid from '@mui/material/Grid2'
import Calendar from '../calendar/Calendar'
import SpeedIcon from '@mui/icons-material/Speed'
import EmailIcon from '@mui/icons-material/Email'
import PageShell from '../layout/PageShell'

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
  const [openVerificationDialog, setOpenVerificationDialog] = useState(false)

  const { data: progressData, isLoading: progressLoading } = useCourseProgress(studentId, course.id)

  const progress = progressData?.progressPercentage || 0

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

  const handleVerificationDialogClose = () => {
    setOpenVerificationDialog(false)
  }

  const verificationDialog = (
    <Dialog
      open={openVerificationDialog}
      onClose={handleVerificationDialogClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: { borderRadius: '14px', p: 1 }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
        <EmailIcon sx={{ fontSize: 40, color: 'primary.main', display: 'block', mx: 'auto', mb: 1 }} />
        Email verification required
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2, borderRadius: '10px' }}>
          Please verify your email address to access course content.
        </Alert>
        <Typography sx={{ mb: 1.5 }}>
          Check your inbox for a verification link. If you have not received it, look in spam or contact support.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={handleVerificationDialogClose} variant='contained' sx={{ minWidth: 120, boxShadow: 'none' }}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  )

  return (
    <>
      <Card
        sx={{
          height: '100%',
          overflow: 'hidden',
          borderRadius: '14px',
          bgcolor: '#fff',
          color: 'text.primary',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0px 8px 24px rgba(10, 37, 64, 0.06)',
          opacity: isEmailVerified ? 1 : 0.78,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 12px 28px rgba(10, 37, 64, 0.1)'
          }
        }}
      >
        <Box
          onClick={handleThumbnailClick}
          sx={{
            width: '100%',
            height: { xs: 160, sm: 150 },
            overflow: 'hidden',
            bgcolor: 'rgba(31, 126, 194, 0.08)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer'
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
              component='img'
              src='/course-card-placeholder-icon.svg'
              alt='Course placeholder'
              sx={{ width: 48, height: 48 }}
            />
          )}
        </Box>

        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Typography
            sx={{
              fontFamily: '"Fraunces", serif',
              fontWeight: 600,
              fontSize: '1.05rem',
              color: 'secondary.dark',
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {course.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={48}
                thickness={4.5}
                sx={{ color: 'grey.200' }}
              />
              <CircularProgress
                variant="determinate"
                value={progressLoading ? 0 : progress}
                size={48}
                thickness={4.5}
                sx={{ color: 'primary.main', position: 'absolute', left: 0 }}
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
                  justifyContent: 'center'
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'primary.main' }}>
                  {progressLoading ? '…' : `${progress}%`}
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              Course progress
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexWrap: 'wrap' }}>
            <Button
              onClick={handleQuickView}
              variant="outlined"
              size="small"
              startIcon={<SpeedIcon sx={{ fontSize: 18 }} />}
              sx={{ flex: 1, minWidth: 110, borderRadius: '8px', boxShadow: 'none' }}
            >
              Quick view
            </Button>
            <Button
              onClick={handleDetailView}
              variant="contained"
              size="small"
              sx={{ flex: 1, minWidth: 110, borderRadius: '8px', boxShadow: 'none' }}
            >
              Detailed view
            </Button>
          </Box>
        </Box>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='sm'
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
          Unit progress
        </DialogTitle>
        <DialogContent>
          {progressData ? (
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{
                  width: '100%',
                  height: 10,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  mb: 0.75
                }}
              >
                <Box
                  sx={{
                    width: `${progressData.progressPercentage || 0}%`,
                    height: '100%',
                    bgcolor: 'primary.main',
                    borderRadius: 1
                  }}
                />
              </Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                {progressData.progressPercentage || 0}% complete · {progressData.completedUnits || 0} of {progressData.totalUnits || 0} units
              </Typography>
            </Box>
          ) : (
            <Typography color='text.secondary' align='center' sx={{ py: 3 }}>
              No progress data available
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant='contained' sx={{ boxShadow: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {verificationDialog}
    </>
  )
})

const StudentDashboard = () => {
  const { user } = useAuth()
  const courseIds = user?.courseIds?.map(course => course.courseId) || []
  const { data: courses } = useEnrolledCourses(courseIds)
  const { allDueDates, error } = useAllAssessmentDueDates(user?.courseIds)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (error) {
    console.error('Error loading assessment due dates:', error)
  }

  return (
    <Box sx={{ p: { xs: 0, md: 0.5 } }}>
      {!user?.emailVerified && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2.5, 
            borderRadius: '12px',
            '& .MuiAlert-icon': { fontSize: 24 }
          }}
          icon={<EmailIcon />}
        >
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
            Email verification required
          </Typography>
          <Typography variant="body2">
            Please verify your email address to access course content. Check your inbox for a verification link.
          </Typography>
        </Alert>
      )}

    <Grid container spacing={2}>
      <Grid 
        size={{ xs: 12, md: Object.keys(allDueDates || {}).length > 0 ? 8 : 12 }}
        order={{ xs: 1, md: 1 }}
      >
        <PageShell kicker="Learning" title="Current courses">
          <Grid container spacing={2}>
            {courses?.length > 0 ? (
              courses.map(course => (
                <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <CourseRow course={course} studentId={user.studentId} />
                </Grid>
              ))
            ) : (
              <Grid size={12}>
                <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  No courses enrolled yet
                </Typography>
              </Grid>
            )}
          </Grid>
        </PageShell>
      </Grid>

      {/* Calendar — only when due-date data exists */}
      {!isMobile && Object.keys(allDueDates || {}).length > 0 && (
        <Grid 
          size={{ md: 4 }}
          order={{ md: 2 }}
        >
          <Paper
            elevation={5}
            sx={{ backgroundColor: 'transparent', borderRadius: 2 }}
          >
            <Calendar assessmentDueDates={allDueDates} />
          </Paper>
        </Grid>
      )}
    </Grid>
    </Box>
  )
}

export default StudentDashboard
