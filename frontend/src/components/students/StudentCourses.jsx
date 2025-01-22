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
import url from '../config/server-url'

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
      
      // Calculate overall progress
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
          width: '200px',
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

// Add this helper function
const getThumbnailUrl = (fileName) => {
  if (!fileName) return ''
  return `${url}resources/files/THUMBNAILS/${fileName}`
}

// Course Row Component
const CourseRow = ({ course, onRemove, studentId }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {/* Course Card */}
      <Grid xs={4}>
        <Card
          sx={{
            height: '100%',
            width: '200px',
            p: 2,
            border: '1px solid #3366CC33',
            borderRadius: '12px',
            boxShadow: '0px 14px 42px 0px #080F340F',
            position: 'relative'
          }}
        >
          <IconButton
            onClick={() => onRemove(course)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'white',
              width: '32px',
              height: '32px',
              '&:hover': {
                backgroundColor: 'white',
                opacity: 0.9
              },
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <RemoveCircleOutlineIcon sx={{ color: 'error.main' }} />
          </IconButton>

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
            {course.units?.length || 0} Units
          </Typography>
        </Card>
      </Grid>

      {/* Progress Card */}
      <Grid xs={4}>
        <CourseProgressCard courseId={course._id} studentId={studentId} />
      </Grid>

      {/* Decorative Card */}
      <Grid xs={4}>
        <DecorativeCard />
      </Grid>
    </Grid>
  )
}

// Main StudentCourses Component
const StudentCourses = () => {
  const { id } = useParams()
  const [studentName, setStudentName] = useState('')
  const [courses, setCourses] = useState([])
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)

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
      const response = await deleteData(`student/${id}/courses/${selectedCourse._id}`)
      if (response.status === 200) {
        fetchStudentCourses()
        handleCloseRemoveDialog()
      }
    } catch (error) {
      console.error('Error removing course:', error)
    }
  }

  const activeCourses = courses.filter(course => course.courseStatus === 1)
  const inactiveCourses = courses.filter(course => course.courseStatus === 2)

  return (
    <Paper elevation={5} sx={{ p: 3, borderRadius: '16px', bgcolor: 'white' }}>
      <Typography variant="h6" sx={{ mb: 3, fontSize: '24px', fontWeight: 'bold' }}>
        {studentName}'s Courses
      </Typography>

      {activeCourses.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: '18px', color: 'text.secondary' }}>
            Active Courses
          </Typography>
          {activeCourses.map(course => (
            <CourseRow
              key={course._id}
              course={course}
              onRemove={handleRemoveCourse}
              studentId={id}
            />
          ))}
        </Box>
      )}

      {inactiveCourses.length > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '18px', color: 'text.secondary' }}>
              Inactive Courses
            </Typography>
            {inactiveCourses.map(course => (
              <CourseRow
                key={course._id}
                course={course}
                onRemove={handleRemoveCourse}
                studentId={id}
              />
            ))}
          </Box>
        </>
      )}

      {courses.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          No courses found for this student
        </Typography>
      )}

      <Dialog
        open={openRemoveDialog}
        onClose={handleCloseRemoveDialog}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}
      >
        <DialogTitle sx={{ pb: 2 }}>Remove Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{selectedCourse?.name}</strong>? This action will
            permanently delete all progress associated with this course.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmRemove} variant="contained" color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default StudentCourses
