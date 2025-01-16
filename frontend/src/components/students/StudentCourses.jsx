import React, { useState, useEffect, memo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  Paper,
  Typography,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AssessmentIcon from '@mui/icons-material/Assessment'
import { getData, deleteData } from '../../api/api'

// Separate Analytics Content Component
const AnalyticsContent = memo(({ courseId, studentId }) => {
  const [unitsProgress, setUnitsProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUnitsProgress()
  }, [courseId, studentId])

  const fetchUnitsProgress = async () => {
    setLoading(true)
    try {
      const response = await getData(`student/${studentId}/courses/${courseId}/progress`)
      setUnitsProgress(response.data.data || [])
    } catch (error) {
      console.error('Error fetching units progress:', error)
      setUnitsProgress([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {unitsProgress.map(unit => (
            <Grid key={unit._id} item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                    {unit.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {unit.viewedResources} of {unit.totalResources} resources viewed
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', pt: 0.5 }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
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
                    variant="body2"
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'text.secondary'
                    }}
                  >
                    {unit.progress}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
          {unitsProgress.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" align="center">
                No units found for this course
              </Typography>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  )
})

AnalyticsContent.displayName = 'AnalyticsContent'

// Main StudentCourses Component
const StudentCourses = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [studentName, setStudentName] = useState('')
  const [courses, setCourses] = useState([])
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [openAnalyticsDialog, setOpenAnalyticsDialog] = useState(false)
  const [selectedCourseForAnalytics, setSelectedCourseForAnalytics] =
    useState(null)

  useEffect(() => {
    fetchStudentCourses()
  }, [id])

  const fetchStudentCourses = async () => {
    try {
      const response = await getData(`student/${id}/courses`)
      if (response.status === 200) {
        const { studentName, courses } = response.data.data
        setStudentName(studentName)
        setCourses(courses || [])
      }
    } catch (error) {
      console.error('Error fetching student courses:', error)
    }
  }

  const handleRemoveCourse = course => {
    setSelectedCourse(course)
    setOpenRemoveDialog(true)
  }

  const handleCloseRemoveDialog = () => {
    setOpenRemoveDialog(false)
    setSelectedCourse(null)
  }

  const handleConfirmRemove = async () => {
    try {
      const response = await deleteData(
        `student/${id}/courses/${selectedCourse._id}`
      )
      if (response.status === 200) {
        fetchStudentCourses() // Refresh the courses list
        handleCloseRemoveDialog()
      }
    } catch (error) {
      console.error('Error removing course:', error)
    }
  }

  const handleOpenAnalytics = (e, course) => {
    e.stopPropagation() // Prevent course card click
    setSelectedCourseForAnalytics(course)
    setOpenAnalyticsDialog(true)
  }

  const handleCloseAnalytics = () => {
    setOpenAnalyticsDialog(false)
    setSelectedCourseForAnalytics(null)
  }

  const handleCourseClick = course => {
    navigate(`/admin/students/${id}/courses/${course._id}/progress`, {
      state: {
        studentName: studentName,
        courseName: course.name
      }
    })
  }

  const CourseGrid = ({ courses, title }) => (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant='h6'
        sx={{ mb: 2, fontSize: '18px', color: 'text.secondary' }}
      >
        {title}
      </Typography>
      <Grid container spacing={2}>
        {courses.map(course => (
          <Grid key={course._id} size={2.5}>
            <Card
              onClick={() => handleCourseClick(course)}
              sx={{
                p: 2,
                height: '100%',
                width: '200px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                border: '1px solid #3366CC33',
                position: 'relative',
                boxShadow: '0px 14px 42px 0px #080F340F',
                transition: 'transform 0.2s',
                opacity: course.courseStatus === 2 ? 0.8 : 1,
                '&:hover': {
                  transform: 'scale(1.02)',
                  cursor: 'pointer'
                }
              }}
            >
              <IconButton
                onClick={() => handleRemoveCourse(course)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'white',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'white'
                  },
                  zIndex: 1
                }}
              >
                <RemoveCircleOutlineIcon sx={{ color: '#FF4444' }} />
              </IconButton>

              <IconButton
                onClick={(e) => handleOpenAnalytics(e, course)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 48,
                  backgroundColor: 'white',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'white'
                  },
                  zIndex: 1
                }}
              >
                <AssessmentIcon sx={{ color: 'primary.main' }} />
              </IconButton>

              <Box
                sx={{
                  width: '100%',
                  height: '120px',
                  bgcolor: course.thumbnail ? 'transparent' : 'primary.light',
                  borderRadius: '8px',
                  mb: 2
                }}
              >
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MenuBookOutlinedIcon
                      sx={{ fontSize: 40, color: 'primary.main' }}
                    />
                  </Box>
                )}
              </Box>
              <Typography variant='h6' sx={{ mb: 1, fontSize: '14px' }}>
                {course.name}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  const activeCourses = courses.filter(course => course.courseStatus === 1)
  const inactiveCourses = courses.filter(course => course.courseStatus === 2)

  return (
    <>
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
            fontWeight: 'bold'
          }}
        >
          {studentName}'s Courses
        </Typography>

        {activeCourses.length > 0 && (
          <CourseGrid courses={activeCourses} title='Active Courses' />
        )}

        {inactiveCourses.length > 0 && (
          <>
            <Divider sx={{ my: 4 }} />
            <CourseGrid courses={inactiveCourses} title='Inactive Courses' />
          </>
        )}

        {courses.length === 0 && (
          <Typography
            color='text.secondary'
            sx={{ textAlign: 'center', mt: 3 }}
          >
            No courses found for this student
          </Typography>
        )}
      </Paper>

      <Dialog
        open={openRemoveDialog}
        onClose={handleCloseRemoveDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>Remove Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove{' '}
            <strong>{selectedCourse?.name}</strong>? This action will
            permanently delete all progress associated with this course.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveDialog} color='primary'>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemove}
            variant='contained'
            color='error'
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAnalyticsDialog}
        onClose={handleCloseAnalytics}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            minHeight: '60vh'
          }
        }}
      >
        <DialogTitle>
          {selectedCourseForAnalytics
            ? `Resource Analytics - ${selectedCourseForAnalytics.name}`
            : 'Resource Analytics'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', p: 0 }}>
          {selectedCourseForAnalytics && (
            <AnalyticsContent
              courseId={selectedCourseForAnalytics._id}
              studentId={id}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAnalytics}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default StudentCourses
