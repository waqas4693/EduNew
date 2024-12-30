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
  const [units, setUnits] = useState([])
  const [sections, setSections] = useState({})
  const [resourcesWithStatus, setResourcesWithStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [sectionLoading, setSectionLoading] = useState(false)
  const [resourceLoading, setResourceLoading] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedSection, setSelectedSection] = useState(null)

  useEffect(() => {
    fetchUnits(courseId)
  }, [courseId])

  const fetchUnits = async courseId => {
    setLoading(true)
    try {
      const response = await getData(`units/${courseId}`)
      setUnits(response.data.units || [])
    } catch (error) {
      console.error('Error fetching units:', error)
      setUnits([])
    } finally {
      setLoading(false)
    }
  }

  const handleUnitSelect = async unit => {
    setSelectedUnit(unit)
    setSelectedSection(null)
    if (!sections[unit._id]) {
      setSectionLoading(true)
      try {
        const response = await getData(`sections/${unit._id}`)
        setSections(prev => ({
          ...prev,
          [unit._id]: response.data.sections || []
        }))
      } catch (error) {
        console.error('Error fetching sections:', error)
        setSections(prev => ({
          ...prev,
          [unit._id]: []
        }))
      } finally {
        setSectionLoading(false)
      }
    }
  }

  const handleSectionSelect = async section => {
    setSelectedSection(section)
    if (!resourcesWithStatus[section._id]) {
      setResourceLoading(true)
      try {
        const response = await getData(
          `resources/${section._id}/student/${studentId}/status`
        )
        setResourcesWithStatus(prev => ({
          ...prev,
          [section._id]: response.data.data || []
        }))
      } catch (error) {
        console.error('Error fetching resources:', error)
        setResourcesWithStatus(prev => ({
          ...prev,
          [section._id]: []
        }))
      } finally {
        setResourceLoading(false)
      }
    }
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Left sidebar with units */}
      <Box
        sx={{
          width: '250px',
          borderRight: 1,
          borderColor: 'divider',
          overflow: 'auto'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          units.map(unit => (
            <Box
              key={unit._id}
              onClick={() => handleUnitSelect(unit)}
              sx={{
                p: 2,
                cursor: 'pointer',
                bgcolor:
                  selectedUnit?._id === unit._id
                    ? 'primary.light'
                    : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <Typography>{unit.name}</Typography>
            </Box>
          ))
        )}
      </Box>

      {/* Right content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUnit && (
          <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Sections list */}
            <Box
              sx={{
                width: '250px',
                borderRight: 1,
                borderColor: 'divider',
                overflow: 'auto'
              }}
            >
              {sectionLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                sections[selectedUnit._id]?.map(section => (
                  <Box
                    key={section._id}
                    onClick={() => handleSectionSelect(section)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor:
                        selectedSection?._id === section._id
                          ? 'primary.light'
                          : 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Typography>{section.name}</Typography>
                  </Box>
                ))
              )}
            </Box>

            {/* Resources list */}
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              {selectedSection && (
                <>
                  {resourceLoading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      {resourcesWithStatus[selectedSection._id]?.map(
                        resource => (
                          <Paper
                            key={resource._id}
                            elevation={0}
                            sx={{
                              p: 2,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1
                            }}
                          >
                            <Typography>{resource.name}</Typography>
                            <Typography
                              sx={{
                                color: resource.isViewed
                                  ? 'success.main'
                                  : 'error.main',
                                fontWeight: 'bold'
                              }}
                            >
                              {resource.isViewed ? 'Viewed' : 'Not Viewed'}
                            </Typography>
                          </Paper>
                        )
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>
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

  const handleOpenAnalytics = course => {
    setSelectedCourseForAnalytics(course)
    setOpenAnalyticsDialog(true)
  }

  const handleCloseAnalytics = () => {
    setOpenAnalyticsDialog(false)
    setSelectedCourseForAnalytics(null)
  }

  const handleCourseClick = course => {
    navigate(`/admin/students/${id}/courses/${course._id}/progress`)
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
                onClick={() => handleOpenAnalytics(course)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 48, // Position it next to remove button
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
