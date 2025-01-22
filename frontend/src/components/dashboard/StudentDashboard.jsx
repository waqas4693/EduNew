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
  Button
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
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'

const getThumbnailUrl = (fileName) => {
  if (!fileName) return ''
  return `${url}resources/files/THUMBNAILS/${fileName}`
}

// Progress Card Component
const CourseProgressCard = memo(({ courseId, studentId }) => {
  const [unitsProgress, setUnitsProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    fetchUnitsProgress()
  }, [courseId, studentId])

  const fetchUnitsProgress = async () => {
    try {
      const response = await getData(`student/${studentId}/courses/${courseId}/progress`)
      const progressData = response.data.data || []
      setUnitsProgress(progressData)
      
      if (progressData.length > 0) {
        const totalProgress = progressData.reduce((sum, unit) => sum + unit.progress, 0)
        setOverallProgress(Math.round(totalProgress / progressData.length))
      }
    } catch (error) {
      console.error('Error fetching units progress:', error)
      setUnitsProgress([])
    } finally {
      setLoading(false)
    }
  }

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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '16px' }}>
              Course Progress
            </Typography>
            
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
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
                  <Typography variant="caption" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {`${overallProgress}%`}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '14px' }}>
                Click to view unit details
              </Typography>
            </Box>
          </Box>
        )}
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 2
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontSize: '18px', fontWeight: 'bold' }}>
            Unit Progress Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {unitsProgress.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              {unitsProgress.map(unit => (
                <Box key={unit._id} sx={{ mb: 3 }}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
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
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                      {unit.progress}% Complete
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              No progress data available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
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
        component="img"
        src="/ai-education.png"
        alt="AI Education"
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

// Course Row Component
const CourseRow = ({ course, studentId }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleCourseClick = () => {
    dispatch(setCurrentCourse({
      id: course.id,
      name: course.name,
      image: getThumbnailUrl(course.image)
    }))
    navigate(`/units/${course.id}`)
  }

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {/* Course Card */}
      <Grid xs={4}>
        <Card
          onClick={handleCourseClick}
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
          <Box
            sx={{
              width: '100%',
              height: '120px',
              bgcolor: course.image ? 'transparent' : 'primary.light',
              borderRadius: '8px',
              mb: 2
            }}
          >
            {course.image ? (
              <img
                src={getThumbnailUrl(course.image)}
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
                <MenuBookOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            )}
          </Box>

          <Typography variant="h6" sx={{ mb: 1, fontSize: '14px' }}>
            {course.name}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '12px' }}>
            {course.units} Units
          </Typography>
        </Card>
      </Grid>

      {/* Progress Card */}
      <Grid xs={4}>
        <CourseProgressCard courseId={course.id} studentId={studentId} />
      </Grid>

      {/* Decorative Card */}
      <Grid xs={4}>
        <DecorativeCard />
      </Grid>
    </Grid>
  )
}

const StudentDashboard = () => {
  const [courses, setCourses] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        if (user?.courseIds?.length > 0) {
          const courseIdList = user.courseIds.map(course => course.courseId)
          const response = await getData(`courses/enrolled?courseIds=${courseIdList.join(',')}`)
          
          if (response.status === 200) {
            setCourses(response.data.data)
            
            const assessmentIntervals = {}
            response.data.data.forEach(course => {
              assessmentIntervals[course.id] = course.assessmentInterval
            })
            localStorage.setItem('assessmentIntervals', JSON.stringify(assessmentIntervals))
          }
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error)
      }
    }

    fetchEnrolledCourses()
  }, [user])

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
          {courses.length > 0 ? (
            courses.map(course => (
              <CourseRow
                key={course.id}
                course={course}
                studentId={user.studentId}
              />
            ))
          ) : (
            <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
              No courses enrolled yet
            </Typography>
          )}
        </Paper>
      </Grid>
      <Grid size={4}>
        <Paper
          elevation={5}
          sx={{ backgroundColor: 'transparent', borderRadius: 2 }}
        >
          <Calendar />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default StudentDashboard
