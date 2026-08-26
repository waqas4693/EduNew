import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  Chip,
  Button,
  Dialog,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import { getData, deleteData } from '../../api/api'
import { useCourseProgress } from '../../hooks/useCourses'
import PageShell from '../layout/PageShell'

const CourseCard = ({ course, onRemove, studentId, studentName, inactive }) => {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailLoading, setThumbnailLoading] = useState(true)
  const { data: progressData, isLoading } = useCourseProgress(studentId, course._id)

  const progress = Math.round(progressData?.progressPercentage || 0)
  const totalUnits = progressData?.totalUnits || progressData?.units?.length || 0
  const completedUnits = progressData?.completedUnits || 0
  const thumbnail = course.thumbnail || course.image

  useEffect(() => {
    const fetchThumbnailUrl = async () => {
      if (!thumbnail) {
        setImageError(true)
        setThumbnailLoading(false)
        return
      }

      try {
        setThumbnailLoading(true)
        const response = await getData(`resources/files/url/THUMBNAILS/${thumbnail}`)
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
    }

    fetchThumbnailUrl()
  }, [thumbnail])

  const handleViewProgress = () => {
    navigate(`/admin/students/${studentId}/courses/${course._id}/progress`, {
      state: {
        courseName: course.name,
        studentName
      }
    })
  }

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        overflow: 'hidden',
        borderRadius: '14px',
        bgcolor: inactive ? 'rgba(10, 37, 64, 0.03)' : '#fff',
        boxShadow: '0px 8px 24px rgba(10, 37, 64, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        opacity: inactive ? 0.82 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0px 12px 28px rgba(10, 37, 64, 0.1)'
        }
      }}
    >
      <Box
        onClick={handleViewProgress}
        sx={{
          height: 150,
          bgcolor: 'rgba(31, 126, 194, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        {thumbnailLoading ? (
          <CircularProgress size={32} />
        ) : thumbnail && !imageError && thumbnailUrl ? (
          <Box
            component="img"
            src={thumbnailUrl}
            alt={course.name}
            onError={() => setImageError(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            component="img"
            src="/course-card-placeholder-icon.svg"
            alt=""
            sx={{ width: 48, height: 48 }}
          />
        )}
        <IconButton
          aria-label={`Remove ${course.name}`}
          onClick={(event) => {
            event.stopPropagation()
            onRemove(course)
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            bgcolor: '#fff',
            '&:hover': { bgcolor: '#fff' }
          }}
        >
          <RemoveCircleOutlineIcon sx={{ color: 'error.main', fontSize: 20 }} />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Chip
          size="small"
          label={inactive ? 'Inactive' : 'Active'}
          sx={{
            alignSelf: 'flex-start',
            mb: 1,
            fontWeight: 600,
            bgcolor: inactive ? 'rgba(10, 37, 64, 0.08)' : 'rgba(31, 126, 194, 0.1)',
            color: inactive ? 'text.secondary' : 'primary.dark'
          }}
        />
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
            overflow: 'hidden',
            minHeight: '2.5em'
          }}
        >
          {course.name}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {isLoading ? 'Loading progress' : `${completedUnits} of ${totalUnits} units`}
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'primary.main' }}>
              {isLoading ? '…' : `${progress}%`}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={isLoading ? 0 : progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Button
          variant="contained"
          size="small"
          onClick={handleViewProgress}
          sx={{ mt: 'auto', borderRadius: '8px', boxShadow: 'none' }}
        >
          View progress
        </Button>
      </Box>
    </Card>
  )
}

const CourseSection = ({ title, courses, inactive, studentId, studentName, onRemove }) => {
  if (!courses.length) return null

  return (
    <Box sx={{ mb: inactive ? 0 : 4 }}>
      <Typography
        sx={{
          mb: 2,
          fontSize: 13,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          fontWeight: 600
        }}
      >
        {title}
      </Typography>
      <Grid container spacing={2.5}>
        {courses.map((course) => (
          <Grid key={course._id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <CourseCard
              course={course}
              inactive={inactive}
              studentId={studentId}
              studentName={studentName}
              onRemove={onRemove}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

const StudentCourses = () => {
  const { id } = useParams()
  const [studentName, setStudentName] = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    fetchStudentCourses()
  }, [id])

  const fetchStudentCourses = async () => {
    try {
      setLoading(true)
      const response = await getData(`student/${id}/courses`)
      if (response.status === 200) {
        const data = response.data.data
        setStudentName(data.studentName)
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching student courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCourse = (course) => {
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

  const activeCourses = courses.filter((course) => course.courseStatus === 1)
  const inactiveCourses = courses.filter((course) => course.courseStatus === 2)

  return (
    <PageShell
      kicker="Students"
      title={`${studentName || 'Student'}'s courses`}
      subtitle={`${activeCourses.length} active · ${inactiveCourses.length} inactive`}
    >
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : courses.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: 'secondary.dark', mb: 0.75 }}>
            No courses yet
          </Typography>
          <Typography color="text.secondary">
            This student is not enrolled in any courses.
          </Typography>
        </Box>
      ) : (
        <>
          <CourseSection
            title="Active courses"
            courses={activeCourses}
            studentId={id}
            studentName={studentName}
            onRemove={handleRemoveCourse}
          />
          <CourseSection
            title="Inactive courses"
            courses={inactiveCourses}
            inactive
            studentId={id}
            studentName={studentName}
            onRemove={handleRemoveCourse}
          />
        </>
      )}

      <Dialog
        open={openRemoveDialog}
        onClose={handleCloseRemoveDialog}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}
      >
        <DialogTitle sx={{ pb: 2 }}>Remove course</DialogTitle>
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
    </PageShell>
  )
}

export default StudentCourses
