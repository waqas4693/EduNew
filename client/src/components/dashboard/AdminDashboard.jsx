import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Menu,
  Tooltip,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material'
import { getData, patchData, API_URL } from '../../api/api'
import Grid from '@mui/material/Grid2'
import EditIcon from '@mui/icons-material/Edit'
import GroupIcon from '@mui/icons-material/Group'
import BlockIcon from '@mui/icons-material/Block'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import { useNavigate } from 'react-router-dom'
import PageShell from '../layout/PageShell'

const getThumbnailUrl = (fileName) => {
  if (!fileName) return ''
  return `${API_URL}resources/files/THUMBNAILS/${fileName}`
}

const AdminCourseCard = ({ course, onMenuOpen }) => {
  const [imageError, setImageError] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailLoading, setThumbnailLoading] = useState(true)

  useEffect(() => {
    const fetchThumbnailUrl = async () => {
      if (course.thumbnail) {
        try {
          setThumbnailLoading(true)
          const response = await getData(`resources/files/url/THUMBNAILS/${course.thumbnail}`)
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
  }, [course.thumbnail])

  return (
    <Card
      sx={{
        p: 2,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '14px',
        position: 'relative',
        boxShadow: '0px 8px 24px rgba(10, 37, 64, 0.06)',
        bgcolor: '#fff',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0px 12px 28px rgba(10, 37, 64, 0.1)',
          cursor: 'pointer'
        }
      }}
    >
      <IconButton
        size="small"
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
        onClick={(e) => onMenuOpen(e, course)}
      >
        <MoreVertIcon sx={{ transform: 'rotate(90deg)' }} />
      </IconButton>
      <Box
        sx={{
          width: '100%',
          height: '120px',
          bgcolor: course.thumbnail && !imageError ? 'transparent' : 'rgba(31, 126, 194, 0.12)',
          borderRadius: '8px',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {thumbnailLoading ? (
          <CircularProgress size={32} />
        ) : course.thumbnail && !imageError && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={course.name}
            onError={() => setImageError(true)}
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
      <Tooltip title={course.name}>
        <Typography
          sx={{
            mb: 0.5,
            fontFamily: '"Fraunces", serif',
            fontWeight: 600,
            fontSize: '1rem',
            color: 'secondary.dark',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {course.name}
        </Typography>
      </Tooltip>
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
        {course.units?.length || 0} {course.units?.length === 1 ? 'unit' : 'units'}
      </Typography>
    </Card>
  )
}

const AdminDashboard = () => {
  const [courses, setCourses] = useState([])
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeCourses: 0,
    activeStudents: 0
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [coursesResponse, statsResponse] = await Promise.all([
        getData('courses'),
        getData('student/stats')
      ])

      if (coursesResponse.status === 200) {
        setCourses(coursesResponse.data.data)
      }

      if (statsResponse.status === 200) {
        setStats(statsResponse.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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
    try {
      if (selectedCourse) {
        const response = await patchData(`courses/${selectedCourse._id}/status`, {
          status: 2
        })

        if (response.status === 200) {
          fetchDashboardData()
          alert('Course marked as inactive successfully')
        }
      }
      handleMenuClose()
    } catch (error) {
      console.error('Error marking course as inactive:', error)
      alert('Error marking course as inactive')
    }
  }

  const StatCard = ({ title, value, icon }) => (
    <Card
      sx={{
        p: 2.25,
        minHeight: 108,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '14px',
        bgcolor: '#F5F8FB',
        boxShadow: 'none'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <Box
          sx={{
            mr: 1.75,
            borderRadius: '12px',
            bgcolor: 'rgba(31, 126, 194, 0.12)',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {React.cloneElement(icon, {
            sx: {
              color: 'primary.main',
              fontSize: 24
            }
          })}
        </Box>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.3 }}>
          {title}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: '"Fraunces", serif',
          fontWeight: 600,
          fontSize: '1.75rem',
          color: 'secondary.dark',
          pl: 1
        }}
      >
        {value}
      </Typography>
    </Card>
  )

  return (
    <Box sx={{ p: { xs: 0, md: 0.5 } }}>
      <PageShell kicker="Overview" title="Dashboard">
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 280,
              flexDirection: 'column',
              gap: 2
            }}
          >
            <CircularProgress size={40} />
            <Typography color="text.secondary">Loading dashboard…</Typography>
          </Box>
        ) : (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              title="Total Courses" 
              value={stats.totalCourses} 
              icon={<MenuBookOutlinedIcon />} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              title="Total Students" 
              value={stats.totalStudents} 
              icon={<GroupOutlinedIcon />} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              title="Active Courses" 
              value={stats.activeCourses} 
              icon={<PersonOutlineOutlinedIcon />} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard 
              title="Active Students" 
              value={stats.activeStudents} 
              icon={<ArchiveOutlinedIcon />} 
            />
          </Grid>

          <Grid size={12}>
            <Box sx={{ mt: 1 }}>
              <Typography
                sx={{
                  mb: 0.5,
                  fontFamily: '"Fraunces", serif',
                  fontWeight: 600,
                  fontSize: '1.25rem',
                  color: 'secondary.dark'
                }}
              >
                Courses
              </Typography>
              <Typography sx={{ mb: 2.5, fontSize: 13.5, color: 'text.secondary' }}>
                Manage active courses, students, and status from one place.
              </Typography>
              <Grid container spacing={2}>
                {courses.length === 0 ? (
                  <Grid size={12}>
                    <Typography color="text.secondary">
                      No courses yet. Create one from Course Management.
                    </Typography>
                  </Grid>
                ) : (
                  courses.map((course) => (
                    <Grid key={course._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                      <AdminCourseCard course={course} onMenuOpen={handleMenuOpen} />
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          </Grid>
        </Grid>
        )}
      </PageShell>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit} sx={{ color: 'primary.main' }}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleViewStudents} sx={{ color: 'info.main' }}>
          <GroupIcon sx={{ mr: 1, fontSize: 20 }} />
          View Students
        </MenuItem>
        <MenuItem onClick={handleMarkInactive} sx={{ color: 'error.main' }}>
          <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
          Mark In-Active
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default AdminDashboard 