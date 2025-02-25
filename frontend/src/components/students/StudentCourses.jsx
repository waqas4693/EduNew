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
          onClick={(e) => {
            e.stopPropagation();
            setOpenDialog(true);
          }}
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
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            zIndex: 1
          }}
        >
          <AssessmentIcon sx={{ color: 'primary.main' }} />
        </IconButton>

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
const CourseRow = ({ course, onRemove, studentId, studentName }) => {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [unitsProgress, setUnitsProgress] = useState([])

  useEffect(() => {
    fetchProgress()
  }, [course._id, studentId])

  const fetchProgress = async () => {
    try {
      const response = await getData(
        `student/${studentId}/courses/${course._id}/progress`
      )
      const progressData = response.data.data || []
      setUnitsProgress(progressData)

      if (progressData.length > 0) {
        const totalProgress = progressData.reduce(
          (sum, unit) => sum + unit.progress,
          0
        )
        setProgress(Math.round(totalProgress / progressData.length))
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickView = (e) => {
    e.stopPropagation()
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleCourseClick = () => {
    navigate(`/admin/students/${studentId}/courses/${course._id}/progress`, {
      state: {
        courseName: course.name,
        studentName: studentName
      }
    })
  }

  return (
    <>
      <Card
        sx={{
          mb: 2,
          width: '100%',
          overflow: 'hidden',
          borderRadius: '12px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          height: '160px'
        }}
      >
        {/* Thumbnail Section */}
        <Box
          sx={{
            width: '200px',
            height: '160px',
            flexShrink: 0,
            position: 'relative'
          }}
        >
          {course.image && !imageError ? (
            <Box
              component='img'
              src={getThumbnailUrl(course.image)}
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
                sx={{
                  width: '48px',
                  height: '48px'
                }}
              />
            </Box>
          )}
          {/* Remove Course Button */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onRemove(course);
            }}
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
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              zIndex: 1
            }}
          >
            <RemoveCircleOutlineIcon sx={{ color: '#e75480' }} />
          </IconButton>
        </Box>

        {/* Course Info Section */}
        <Box sx={{ p: 2, display: 'flex', flex: 1 }}>
          {/* Course Name Section */}
          <Box sx={{ 
            flex: '2 1 0',
            minWidth: '200px',
            pr: 2
          }}>
            <Typography
              variant='h6'
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: 1.2
              }}
            >
              {course.name}
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '14px',
                mt: 1
              }}
            >
              Units: {unitsProgress.length}
            </Typography>
          </Box>

          {/* Vertical Divider */}
          <Box
            sx={{
              borderLeft: '1px solid #E0E0E0',
              height: '100%'
            }}
          />

          {/* Progress Section */}
          <Box sx={{ 
            flex: '2 1 0',
            minWidth: '250px',
            px: 2,
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '14px',
                fontWeight: 500,
                mb: 1
              }}
            >
              Course Progress
            </Typography>

            {loading ? (
              <CircularProgress size={48} />
            ) : (
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                <CircularProgress
                  variant='determinate'
                  value={progress}
                  size={48}
                  thickness={4}
                  sx={{ color: '#4285f4' }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant='caption' sx={{ fontSize: '14px' }}>
                    {`${progress}%`}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant='outlined'
                size='small'
                sx={{
                  borderRadius: '8px',
                  borderColor: '#4285f4',
                  color: '#4285f4',
                  whiteSpace: 'nowrap'
                }}
                onClick={handleCourseClick}
              >
                Detail View
              </Button>
              <Button
                variant='contained'
                size='small'
                sx={{
                  borderRadius: '8px',
                  bgcolor: '#4285f4',
                  whiteSpace: 'nowrap'
                }}
                onClick={handleQuickView}
              >
                Quick View
              </Button>
            </Box>
          </Box>

          {/* Vertical Divider */}
          <Box
            sx={{
              borderLeft: '1px solid #E0E0E0',
              height: '100%'
            }}
          />

          {/* AI Learning Section */}
          <Box sx={{ 
            flex: '1.5 1 0',
            minWidth: '160px',
            pl: 2,
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '14px',
                fontWeight: 500,
                mb: 1,
                width: '100%'
              }}
            >
              AI Powered Learning
            </Typography>
            
            <Box
              component='img'
              src='/ai-education.png'
              alt="AI Education"
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                mb: 1,
                objectFit: 'cover',
                display: 'block',
                margin: '0 auto'
              }}
            />

            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mt: 1,
              justifyContent: 'center',
              width: '100%'
            }}>
              <Button
                variant='outlined'
                size='small'
                sx={{
                  borderRadius: '8px',
                  borderColor: '#4285f4',
                  color: '#4285f4',
                  whiteSpace: 'nowrap'
                }}
              >
                View
              </Button>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Progress Dialog */}
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
        <DialogContent>
          <Grid container spacing={3}>
            {unitsProgress.length > 0 ? (
              unitsProgress.map(unit => (
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
                    <Typography
                      variant='h6'
                      sx={{
                        fontSize: '16px',
                        fontWeight: 500,
                        textAlign: 'center'
                      }}
                    >
                      {unit.name}
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
                        <Typography variant='h6' sx={{ fontSize: '18px', fontWeight: 'bold' }}>
                          {unit.progress}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography color='text.secondary' align='center' sx={{ py: 3 }}>
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
    </>
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
              studentName={studentName}
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
                studentName={studentName}
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
