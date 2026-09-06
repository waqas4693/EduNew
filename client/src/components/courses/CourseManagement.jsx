import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  MenuBookOutlined,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { getData, patchData } from '../../api/api'
import PageShell from '../layout/PageShell'

const CourseManagement = () => {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [thumbnailUrls, setThumbnailUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getData('courses')
      if (response.status === 200) {
        const coursesData = response.data.data || []
        setCourses(coursesData)

        const urls = {}
        await Promise.all(
          coursesData.map(async (course) => {
            if (!course.thumbnail) return
            try {
              const thumbnailResponse = await getData(
                `resources/files/url/THUMBNAILS/${course.thumbnail}`
              )
              if (thumbnailResponse.status === 200) {
                urls[course._id] = thumbnailResponse.data.signedUrl
              }
            } catch (error) {
              console.error('Error fetching thumbnail URL:', error)
            }
          })
        )
        setThumbnailUrls(urls)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Unable to load courses.',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleMenuOpen = (event, course) => {
    setAnchorEl(event.currentTarget)
    setSelectedCourse(course)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedCourse(null)
  }

  const handleEdit = () => {
    if (selectedCourse) {
      navigate(`/admin/courses/${selectedCourse._id}/builder/overview`)
    }
    handleMenuClose()
  }

  const handleViewStudents = () => {
    if (selectedCourse) {
      navigate(`/admin/courses/${selectedCourse._id}/students`)
    }
    handleMenuClose()
  }

  const handleMarkInactive = async () => {
    if (!selectedCourse) return

    try {
      const response = await patchData(`courses/${selectedCourse._id}/status`, {
        status: 2
      })

      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: 'Course marked as inactive.',
          severity: 'success'
        })
        fetchCourses()
      }
    } catch (error) {
      console.error('Error marking course inactive:', error)
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Unable to mark course inactive.',
        severity: 'error'
      })
    } finally {
      handleMenuClose()
    }
  }

  const paginatedCourses = courses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  return (
    <>
      <PageShell
        kicker="Courses"
        title="Course Management"
        subtitle="Create courses, open the builder to edit content, or manage enrollment and status."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/courses/new')}
            sx={{ borderRadius: '8px' }}
          >
            Add course
          </Button>
        }
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : courses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <MenuBookOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>No active courses yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create your first course to start building units, sections, and assessments.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/courses/new')}
              sx={{ borderRadius: '8px' }}
            >
              Add course
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Units</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCourses.map((course) => (
                    <TableRow key={course._id} hover>
                      <TableCell sx={{ width: 120 }}>
                        <Box
                          sx={{
                            width: 100,
                            height: 60,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            bgcolor: course.thumbnail ? 'transparent' : 'rgba(31, 126, 194, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {course.thumbnail && thumbnailUrls[course._id] ? (
                            <img
                              src={thumbnailUrls[course._id]}
                              alt={course.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <MenuBookOutlined sx={{ color: 'primary.main' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>{course.name}</Typography>
                      </TableCell>
                      <TableCell>{course.units?.length || 0}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() =>
                            navigate(`/admin/courses/${course._id}/builder/overview`)
                          }
                          sx={{ mr: 0.5, borderRadius: '8px', textTransform: 'none' }}
                        >
                          Edit
                        </Button>
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuOpen(event, course)}
                          aria-label={`More actions for ${course.name}`}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={courses.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
            />
          </>
        )}
      </PageShell>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit} sx={{ color: 'primary.main' }}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit in builder
        </MenuItem>
        <MenuItem onClick={handleViewStudents} sx={{ color: 'info.main' }}>
          <GroupIcon sx={{ mr: 1, fontSize: 20 }} />
          View students
        </MenuItem>
        <MenuItem onClick={handleMarkInactive} sx={{ color: 'error.main' }}>
          <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
          Mark inactive
        </MenuItem>
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default CourseManagement
