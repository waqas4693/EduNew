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

const getThumbnailUrl = fileName => {
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
      const response = await getData(
        `student/${studentId}/courses/${courseId}/progress`
      )
      const progressData = response.data.data || []
      setUnitsProgress(progressData)

      if (progressData.length > 0) {
        const totalProgress = progressData.reduce(
          (sum, unit) => sum + unit.progress,
          0
        )
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
          {unitsProgress.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              {unitsProgress.map(unit => (
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

// Course Row Component
const CourseRow = ({ course, studentId }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [unitsProgress, setUnitsProgress] = useState([])

  useEffect(() => {
    fetchProgress()
  }, [course.id, studentId])

  const fetchProgress = async () => {
    try {
      const response = await getData(
        `student/${studentId}/courses/${course.id}/progress`
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
        image: getThumbnailUrl(course.image)
      })
    )
    navigate(`/units/${course.id}`)
  }

  const handleDetailView = (e) => {
    e.stopPropagation() // Prevent thumbnail click
    navigate(`/students/${studentId}/courses/${course.id}/progress`, {
      state: {
        courseName: course.name,
        studentName: '' // Will be fetched in StudentProgress component
      }
    })
  }

  return (
    <>
      <Card
        onClick={handleThumbnailClick}
        sx={{
          mb: 2,
          width: '100%',
          overflow: 'hidden',
          borderRadius: '12px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          height: '160px',
          cursor: 'pointer',
        }}
      >
        {/* Thumbnail Section */}
        <Box
          sx={{
            width: '170px',
            height: '160px',
            flexShrink: 0
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
        </Box>

        {/* Course Info Section */}
        <Box sx={{ p: 2, display: 'flex', flex: 1 }}>
          <Box sx={{ width: '100px', flexShrink: 0 }}>
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
              Units: {course.units}
            </Typography>
          </Box>

          {/* Vertical Divider */}
          <Box
            sx={{
              mx: 2,
              borderLeft: '1px solid #E0E0E0',
              height: '100%'
            }}
          />

          {/* Progress Section */}
          <Box sx={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                onClick={handleDetailView}
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
              mx: 2,
              borderLeft: '1px solid #E0E0E0',
              height: '100%'
            }}
          />

          {/* AI Learning Section */}
          <Box sx={{ width: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '14px',
                fontWeight: 500,
                mb: 1
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
                objectFit: 'cover'
              }}
            />

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
              >
                View
              </Button>
            </Box>
          </Box>
        </Box>
      </Card>

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
    </>
  )
}

const StudentDashboard = () => {
  const [courses, setCourses] = useState([])
  const [assessmentDueDates, setAssessmentDueDates] = useState({})
  const { user } = useAuth()

  const calculateDueDate = (enrollmentDate, intervalDays) => {
    const dueDate = new Date(enrollmentDate)
    dueDate.setDate(dueDate.getDate() + parseInt(intervalDays))
    return dueDate
  }

  const fetchAssessmentDueDates = async (courseId, enrollmentDate) => {
    try {
      // Fetch units for the course
      const unitsResponse = await getData(`units/${courseId}`)
      if (unitsResponse.status === 200) {
        const units = unitsResponse.data.units

        // Fetch sections for each unit
        const sectionsPromises = units.map(unit =>
          getData(`sections/${unit._id}`)
        )
        const sectionsResponses = await Promise.all(sectionsPromises)

        // Fetch assessments for each section
        const assessmentPromises = sectionsResponses.flatMap(sectionRes => {
          if (sectionRes.status === 200) {
            return sectionRes.data.sections.map(section =>
              getData(`assessments/${section._id}`)
            )
          }
          return []
        })

        const assessmentResponses = await Promise.all(assessmentPromises)

        // Calculate due dates for each assessment
        const dueDates = {}
        assessmentResponses.forEach(assessmentRes => {
          if (assessmentRes.status === 200) {
            assessmentRes.data.assessments.forEach(assessment => {
              dueDates[assessment._id] = {
                dueDate: calculateDueDate(enrollmentDate, assessment.interval),
                name: assessment.name,
                courseId: courseId,
                unitId: assessment.unitId,
                sectionId: assessment.sectionId,
                type: assessment.assessmentType
              }
            })
          }
        })

        return dueDates
      }
    } catch (error) {
      console.error('Error fetching assessment due dates:', error)
      return {}
    }
  }

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        if (user?.courseIds?.length > 0) {
          const courseIdList = user.courseIds.map(course => course.courseId)
          const response = await getData(
            `courses/enrolled?courseIds=${courseIdList.join(',')}`
          )

          if (response.status === 200) {
            setCourses(response.data.data)

            // Fetch due dates for all courses
            const allDueDates = {}
            await Promise.all(
              user.courseIds.map(async course => {
                const courseDueDates = await fetchAssessmentDueDates(
                  course.courseId,
                  course.enrollmentDate
                )
                Object.assign(allDueDates, courseDueDates)
              })
            )

            // Store in localStorage and state
            localStorage.setItem(
              'assessmentDueDates',
              JSON.stringify(allDueDates)
            )
            setAssessmentDueDates(allDueDates)
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
          <Grid container spacing={2}>
            {courses.length > 0 ? (
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
          <Calendar assessmentDueDates={assessmentDueDates} />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default StudentDashboard
